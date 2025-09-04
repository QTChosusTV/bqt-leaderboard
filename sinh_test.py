import json
import random

NUM_TESTS = 50
MAX_N = 1000  
MAX_K = 1000  

testcases = []
for _ in range(NUM_TESTS):
    n = random.randint(1, MAX_N)
    k = random.randint(1, min(n, MAX_K))
    a = [random.randint(1, 10**9) for _ in range(n+k)]
    o = []
    sum = 0
    for i in range(k):
        sum += a[i]
    for i in range(n):
        o.append(sum)
        sum -= a[i]
        sum += a[i+k]

    input_str = f"{n}\n{k}\n" + " ".join(map(str, a))
    output_str = " ".join(map(str, o))
    testcases.append({"input": input_str, "output": output_str})

with open("random_testcases.json", "w") as f:
    json.dump(testcases, f, indent=2)

print(f"{len(testcases)} testcases written to random_testcases.json")
