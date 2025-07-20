import json
import random
import os

NUM_TESTS = 20
MIN_VALUE = 1
MAX_VALUE = 100_000

testcases = []

for _ in range(NUM_TESTS):
    a = random.randint(MIN_VALUE, MAX_VALUE)
    b = random.randint(MIN_VALUE, MAX_VALUE)

    if (a + b) % 2 == 1:
        testcases.append({
            "input": [a, b],
            "output": -1
        })
    else:
        c1 = (a + b) // 2
        c2 = c1 - b
        testcases.append({
            "input": [a, b],
            "output": [c1, c2]
        })

# Print current directory
print("Current directory:", os.getcwd())

# Save to file in current directory
output_file = "random_testcases.json"
with open(output_file, "w") as f:
    json.dump(testcases, f, indent=2)

print(f"{len(testcases)} testcases written to {output_file}")
