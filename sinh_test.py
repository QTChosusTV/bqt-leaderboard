import random
import json
import math

NUM_SMALL = 10   
MAX_N_SMALL = 20
MAX_TIME = 100
N_LARGE = 5*10**4

TEST = [
    #   CNT     MAXN                  MAXK
    [   10,     1000,                   3  ],
    [   10,     1000000,                5  ],
    [   10,     1000000000,            10  ],
    [   10,     1000000000000000,      15  ],
    [   10,     1000000000000000000,   20  ]
]

def solve(n, k):
    return int(math.ceil(math.log(n, k+1)))

testcases = []

for [cnt, maxn, maxk] in TEST:
    for _ in range(cnt):
        n = random.randint(1, maxn)
        k = random.randint(2, maxk)
        inp = f"{n} {k}"
        #inp = f"{n}\n" + "\n".join(f"{l} {r}" for l, r in intervals)
        out = str(solve(n, k))
        testcases.append({"input": inp, "output": out})

with open("random_testcases.json", "w") as f:
    json.dump(testcases, f, indent=2)

print(f"{len(testcases)} testcases written to random_testcases.json")
