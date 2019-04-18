#
# An attempt to solve a nice problem from SO using a random search approach
#
# The problem is to place the squares of all numbers from 1 to 100 in
# a 11x11 grid writing them either horizontally, vertically or in diagonal.
# 11*11 is only 121 and this means that the required packing is very tight
# (the total number of digits is 358, giving that on average each grid
# cell needs to be used for 2.95 different square numbers).
#
# Do whatever you want with this code, just don't blame me if it doesn't
# do what you think or if it even doesn't do what I say it does.
#
# Andrea "6502" Griffini
#
# Modified by minkbag to allow for different width and height (MxN)
#

import random, time, sys

M = 12
N = 15
K = 100

# These are the numbers we would like to pack
numbers = [str(i*i) for i in xrange(1, K+1)]

# Build the global list of digits (used for weighted random guess)
digits = "".join(numbers)

def random_digit(n=len(digits)-1):
    return digits[random.randint(0, n)]

# By how many lines each of the numbers is currently covered
count = dict((x, 0) for x in numbers)

# Number of actually covered numbers
covered = 0

# All lines in current position (row, cols, diags, counter-diags)
maxDiagLen = min(M, N)
lines = (["*"*N for x in xrange(M)] +
         ["*"*M for x in xrange(N)] +
         ["*"*min(x, maxDiagLen) for x in xrange(1, M)]
         + ["*"*min(x, maxDiagLen) for x in xrange(N, 0, -1)] +
         ["*"*min(x, maxDiagLen) for x in xrange(1, M)]
         + ["*"*min(x, maxDiagLen) for x in xrange(N, 0, -1)])

# lines_of[x, y] -> list of line/char indexes
lines_of = {}
def add_line_of(x, y, L):
    try:
        lines_of[x, y].append(L)
    except KeyError:
        lines_of[x, y] = [L]
for x in xrange(M):
    for y in xrange(N):
        add_line_of(x, y, (x, y))
        add_line_of(x, y, (M + y, x))
        skewDiagK = x+y
        skewDiagPlace = y - max(0, skewDiagK-M+1)
        add_line_of(x, y, (M+N+skewDiagK, skewDiagPlace))
        diagK = (M-1-x)+y
        diagPlace = y - max(0, diagK-M+1)
        add_line_of(x, y, (M+N + M+N-1 +diagK, diagPlace))
        

# Numbers covered by each line
covered_numbers = [set() for x in xrange(len(lines))]

# Which numbers the string x covers
def cover(x):
    c = x + "/" + x[::-1]
    return [y for y in numbers if y in c]

# Set a matrix element
def setValue(x, y, d):
    global covered
    for i, j in lines_of[x, y]:
        L = lines[i]
        C = covered_numbers[i]
        newL = L[:j] + d + L[j+1:]
        newC = set(cover(newL))
        for lost in C - newC:
            count[lost] -= 1
            if count[lost] == 0:
                covered -= 1
        for gained in newC - C:
            count[gained] += 1
            if count[gained] == 1:
                covered += 1
        covered_numbers[i] = newC
        lines[i] = newL

def do_search(k, r):
    start = time.time()

    for i in xrange(r):
        x = random.randint(0, M-1)
        y = random.randint(0, N-1)
        setValue(x, y, random_digit())

    best = None
    attempts = k
    while attempts > 0:
        attempts -= 1
        x = random.randint(0, M-1)
        y = random.randint(0, N-1)
        old = lines[x][y]
        setValue(x, y, random_digit())
        if best is None or covered > best[0]:
            now = time.time()
            sys.stdout.write(str(covered) + chr(13))
            sys.stdout.flush()
            attempts = k
        if best is None or covered >= best[0]:
            best = [covered, lines[:M][:]]
        else:
            setValue(x, y, old)
    print
    sys.stdout.flush()
    return best

for y in xrange(N):
    for x in xrange(M):
        setValue(x, y, random_digit())

best = None

while True:
    if best is not None:
        for y in xrange(N):
            for x in xrange(M):
                setValue(x, y, best[1][x][y])
    x = do_search(100000, N)
    if best is None or x[0] > best[0]:
        print x[0]
        print "\n".join(" ".join(y) for y in x[1])
    if best is None or x[0] >= best[0]:
        best = x[:]


