# trees.py

import random
import json
import subprocess
import os

MAX_VAL = 10**4
EXE = "solver.exe"


# ================================================================
# Prüfer sequence → tree
# ================================================================
def prufer_to_tree(prufer):
    """Convert a Prüfer sequence to a tree (edges). Returns list of (u,v)."""
    m = len(prufer)
    n = m + 2
    degree = [1] * n
    for x in prufer:
        degree[x] += 1

    leaves = [i for i in range(n) if degree[i] == 1]
    leaves.sort()

    edges = []
    ptr = 0

    for v in prufer:
        u = leaves[ptr]
        edges.append((u, v))
        degree[u] -= 1
        degree[v] -= 1
        ptr += 1

        if degree[v] == 1:
            leaves.append(v)
            leaves[ptr:] = sorted(leaves[ptr:])

    remaining = [i for i in range(n) if degree[i] == 1]
    edges.append((remaining[0], remaining[1]))
    return edges


def generate_random_tree_prufer(n, seed=None):
    """Uniform random labeled tree on n nodes (labels 0..n-1)."""
    if n <= 1:
        return []
    if seed is not None:
        random.seed(seed)
    prufer = [random.randrange(0, n) for _ in range(n - 2)]
    return prufer_to_tree(prufer)


def generate_random_tree_edges(n):
    """Return random tree edges with 1-based labels."""
    edges = generate_random_tree_prufer(n)
    return [(u + 1, v + 1) for (u, v) in edges]


# ================================================================
# Solver runner
# ================================================================
def run_solver(inp: str) -> str:
    proc = subprocess.run(
        [EXE],
        input=inp.encode(),
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE
    )
    return proc.stdout.decode().strip()


# ================================================================
# Generate one test case in format:
# n
# u v
# u v
# ...
# q
# u v w
# ...
# ================================================================
def gen_case_tree(n, q):
    edges = generate_random_tree_edges(n)

    # queries
    queries = []
    for _ in range(q):
        u = random.randint(1, n)
        v = random.randint(1, n)
        while v == u:
            v = random.randint(1, n)
        w = random.randint(1, MAX_VAL)
        queries.append((u, v, w))

    # build input
    inp_lines = [str(n)]
    for u, v in edges:
        inp_lines.append(f"{u} {v}")

    inp_lines.append(str(q))
    for u, v, w in queries:
        inp_lines.append(f"{u} {v} {w}")

    inp = "\n".join(inp_lines)

    # run solver
    out = run_solver(inp)

    return {"input": inp, "output": out}


# ================================================================
# Main test generation
# ================================================================
if __name__ == "__main__":
    random.seed(2025)
    tests = []

    # small tests
    for _ in range(15):
        n = random.randint(2, 10)
        q = random.randint(1, 20)
        tests.append(gen_case_tree(n, q))

    # medium-large
    for _ in range(4):
        n = random.randint(100, 300)
        q = random.randint(100, 500)
        tests.append(gen_case_tree(n, q))

    # massive
    for _ in range(1):
        n = 10000
        q = 10000
        tests.append(gen_case_tree(n, q))

    os.makedirs("sinh_test", exist_ok=True)
    with open("testcases.json", "w") as f:
        json.dump(tests, f, indent=2)

    print(f"{len(tests)} testcases generated.")