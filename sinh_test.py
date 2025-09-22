import random
import json

NUM_SMALL = 10   # số test n nhỏ
MAX_N_SMALL = 20
MAX_TIME = 100
N_LARGE = 5*10**4

def max_planes(intervals):
    """
    Tính số máy bay tối đa cùng bay bằng sweepline
    intervals: list of (l,r)
    """
    events = []
    for l,r in intervals:
        events.append((l, 1))       # +1 khi cất cánh
        events.append((r+1, -1))    # -1 khi hạ cánh
    events.sort()
    cnt = 0
    mx = 0
    for _, val in events:
        cnt += val
        if cnt > mx:
            mx = cnt
    return mx

testcases = []

# sinh test nhỏ
for _ in range(NUM_SMALL):
    n = random.randint(1, MAX_N_SMALL)
    intervals = []
    for _ in range(n):
        l = random.randint(1, MAX_TIME)
        r = random.randint(l, MAX_TIME)
        intervals.append((l, r))
    inp = f"{n}\n" + "\n".join(f"{l} {r}" for l, r in intervals)
    out = str(max_planes(intervals))
    testcases.append({"input": inp, "output": out})

# 1 test n lớn
intervals = []
for _ in range(N_LARGE):
    l = random.randint(1, N_LARGE)
    r = random.randint(l, N_LARGE)
    intervals.append((l, r))
inp = f"{N_LARGE}\n" + "\n".join(f"{l} {r}" for l, r in intervals)
out = str(max_planes(intervals))   # Python sweepline vẫn O(n log n) đủ nhanh
testcases.append({"input": inp, "output": out})

# xuất ra json
with open("random_testcases.json", "w") as f:
    json.dump(testcases, f, indent=2)

print(f"{len(testcases)} testcases written to random_testcases.json")
