import json
import re

lines = [line.strip() for line in open("order.txt")]

next = {}
prev = {}
for i in range(len(lines) - 1):
    c = lines[i]
    n = lines[i + 1]
    if c != "" and n != "":
        prev[n] = c
        next[c] = n

parent = {}
index = {}
for x in lines:
    m = re.match("\((.*)\)", x)
    if m:
        index[m.group(1)] = x

    m = re.match("\((.*)\.\d+\)", x)
    if m:
        parent[x] = index[m.group(1)]


json.dump(
    {"prev": prev, "next": next, "parent": parent},
    open("book_navigation.json", "w"),
    indent=2)
