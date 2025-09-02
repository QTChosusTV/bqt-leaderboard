import json
import os

NUM_TESTS = 8
MAX_N = 10  # since hybrid problem is only solvable for small n

def hybrid_solutions(n: int) -> int:
    """
    Count valid placements of n//2 rooks and n - n//2 queens
    on an n x n board (n <= 10).
    """
    m = n // 2
    total = 0
    board = [-1] * n  # board[row] = col (piece placed), -1 = none
    piece = [None] * n  # piece[row] = "Q" or "R"

    def is_safe(row, col, p):
        for r in range(row):
            c = board[r]
            if c == -1:
                continue
            # same column → invalid
            if c == col:
                return False
            if p == "Q" or piece[r] == "Q":
                # queens also attack diagonally
                if abs(c - col) == abs(r - row):
                    return False
        return True

    def backtrack(row, placed_rooks, placed_queens):
        nonlocal total
        if row == n:
            if placed_rooks == m and placed_queens == n - m:
                total += 1
            return

        # try rook
        if placed_rooks < m:
            for col in range(n):
                if is_safe(row, col, "R"):
                    board[row] = col
                    piece[row] = "R"
                    backtrack(row + 1, placed_rooks + 1, placed_queens)
                    board[row] = -1
                    piece[row] = None

        # try queen
        if placed_queens < n - m:
            for col in range(n):
                if is_safe(row, col, "Q"):
                    board[row] = col
                    piece[row] = "Q"
                    backtrack(row + 1, placed_rooks, placed_queens + 1)
                    board[row] = -1
                    piece[row] = None

    backtrack(0, 0, 0)
    return total


# === Generate testcases ===
testcases = []
for n in range(1, NUM_TESTS + 1):
    input_str = f"{n}"
    output_str = str(hybrid_solutions(n))
    testcases.append({"input": input_str, "output": output_str})

print("Current directory:", os.getcwd())
output_file = "hybrid_testcases.json"
with open(output_file, "w") as f:
    json.dump(testcases, f, indent=2)

print(f"{len(testcases)} testcases written to {output_file}")

if __name__ == "__main__":
    pass
