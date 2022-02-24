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


data = "export const nav = " + \
    json.dumps({"prev": prev, "next": next, "parent": parent}, indent=2)
open("book_navigation.js", "w").write(data)
