import json
import random

NUM_TESTS = 50
MAX_N = 1000
MAX_X = 100000
MAX_A = 1000

testcases = []

for _ in range(NUM_TESTS):
    n = random.randint(1, MAX_N)
    X = random.randint(1, MAX_X)
    a = [random.randint(1, MAX_A) for _ in range(n)]
    
    # Compute the output
    a.sort()
    cnt = 0
    l, r = 0, n - 1
    while l < r:
        if a[l] + a[r] <= X:
            cnt += r - l
            l += 1
        else:
            r -= 1

    input_str = f"{n} {X}\n" + " ".join(map(str, a))
    output_str = str(cnt)
    
    testcases.append({"input": input_str, "output": output_str})
    
with open("random_testcases.json", "w") as f:
    json.dump(testcases, f, indent=2)

print(f"{len(testcases)} testcases written to random_testcases.json")
