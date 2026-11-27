"""The shop's QRIS with the amount filled in, so the buyer scans and doesn't type it.

The static payload (what the printed QRIS sticker encodes) is read once and kept on the VM, outside git. The QR is
EMV TLV text: tag 01 "11" = static, "12" = dynamic; tag 54 = amount; tag 62 = additional data (the sticker carries a
fixed bill number in sub-tag 01); tag 63 = CRC-16/CCITT-FALSE of everything before it, including "6304". Money still
goes to the same merchant (tags 26/51 untouched).

Only tag 54 is added; everything else stays as on the sticker. Tested with real payments on 26 Nov: switching to
dynamic ("12") was refused by the shop owner's m-banking ("payment has been made") whether the bill number was the
sticker's, a new one or none, while GoPay paid all of them; the sticker with only the amount added paid in both.

  python bot/qris.py                        # self-check, no network
  python bot/qris.py PAYLOAD_FILE 1001      # print the payload for Rp1.001 (for a test payment)
"""
import sys


def crc(text):
    """CRC-16/CCITT-FALSE as 4 uppercase hex digits."""
    c = 0xFFFF
    for b in text.encode():
        c ^= b << 8
        for _ in range(8):
            c = ((c << 1) ^ 0x1021) if c & 0x8000 else c << 1
            c &= 0xFFFF
    return f"{c:04X}"


def tags(payload):
    """{tag: value} of the top level; ValueError if the text is not well-formed TLV."""
    out, i = {}, 0
    while i < len(payload):
        t, n = payload[i:i + 2], payload[i + 2:i + 4]
        if not (t.isdigit() and n.isdigit()) or i + 4 + int(n) > len(payload):
            raise ValueError(f"bad TLV at {i}")
        out[t] = payload[i + 4:i + 4 + int(n)]
        i += 4 + int(n)
    return out


def with_amount(static, amount):
    """The sticker's payload with `amount` rupiah filled in. Refuses a payload whose CRC is wrong or not a QRIS."""
    t = tags(static)
    if t.get("63") != crc(static[:-4]) or t.get("01") not in ("11", "12") or t.get("53") != "360":
        raise ValueError("not a valid IDR QRIS payload")
    if not (isinstance(amount, int) and 0 < amount <= 10_000_000):
        raise ValueError("amount out of range")
    t["54"] = str(amount)
    del t["63"]
    body = "".join(f"{k}{len(v):02d}{v}" for k, v in sorted(t.items())) + "6304"
    return body + crc(body)


def png(payload):
    """The QR as PNG bytes (python3-qrcode on the VM: apt install python3-qrcode)."""
    import io
    import qrcode   # only the live bot needs it; the self-checks run without it
    buf = io.BytesIO()
    qrcode.make(payload, box_size=10, border=4).save(buf, format="PNG")
    return buf.getvalue()


def _check():
    assert crc("123456789") == "29B1"   # the published check value of CRC-16/CCITT-FALSE
    body = ("000201010211" + "2612" + "00ID.EXAMPLE" + "52045812530336058" + "02ID5904TEST6007JAKARTA" +
            "6225" + "0509S00000000" + "0108BILL0001" + "6304")
    static = body + crc(body)
    out = with_amount(static, 170_037)
    t = tags(out)
    assert t["01"] == "11" and t["54"] == "170037" and t["59"] == "TEST" and t["26"] == "00ID.EXAMPLE"
    assert t["62"] == "0509S00000000" + "0108BILL0001"   # untouched: a changed one is what m-banking refused
    assert t["63"] == crc(out[:-4]) and out.index("5406170037") < out.index("5802ID")   # 54 sits between 53 and 58
    assert with_amount(out, 5) == with_amount(static, 5)   # re-pricing works too
    for bad in (static[:-1] + ("0" if static[-1] != "0" else "1"), "hello", static.replace("5303360", "5303840")):
        try:
            with_amount(bad, 1000)
            raise AssertionError(bad)
        except ValueError:
            pass


if __name__ == "__main__":
    _check()
    if sys.argv[2:]:
        print(with_amount(open(sys.argv[1], encoding="utf-8").read().strip(), int(sys.argv[2])))
    else:
        print("qris check ok")
