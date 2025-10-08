import random, json, subprocess

MAX_VAL = 10**6

def run_solver(inp: str, exe="sinh_test/solver.exe") -> str:
    """Run your compiled C++ .exe and capture output"""
    proc = subprocess.run(
        [exe], input=inp.encode(),
        stdout=subprocess.PIPE, stderr=subprocess.PIPE
    )
    return proc.stdout.decode().strip()

def gen_case(n, q, exe="sinh_test/solver.exe"):
    arr = [random.randint(-MAX_VAL, MAX_VAL) for _ in range(n)]
    queries = [random.randint(-MAX_VAL, MAX_VAL) for _ in range(q)]
    inp = f"{n} {q}\n" + " ".join(map(str, arr)) + "\n" + " ".join(map(str, queries))
    out = run_solver(inp, exe)
    return {"input": inp, "output": out}

testcases = []

# 6 small tests
for _ in range(6):
    n = random.randint(1, 100)
    q = random.randint(1, 100)
    testcases.append(gen_case(n, q))

# 3 medium tests
for _ in range(3):
    n = random.randint(500, 1000)
    q = random.randint(200, 500)
    testcases.append(gen_case(n, q))

# 1 large test
n = 100000
q = 100000
testcases.append(gen_case(n, q))

with open("sinh_test/subseq_testcases.json", "w") as f:
    json.dump(testcases, f, indent=2)

print(f"{len(testcases)} testcases written to subseq_testcases.json")