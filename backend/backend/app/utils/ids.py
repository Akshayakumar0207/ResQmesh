import random
import string
import time


def gen_id(prefix: str) -> str:
    """Short, collision-resistant, human-scannable ID — e.g. EMG-8f2a1c-93."""
    ts = format(int(time.time() * 1000) % 0xFFFFFF, "x")
    rand = "".join(random.choices(string.ascii_lowercase + string.digits, k=4))
    return f"{prefix}-{ts}{rand}"
