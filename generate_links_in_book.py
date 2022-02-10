import json

lines = [line.strip() for line in open("order.txt")]

next = {}
prev = {}
for i in range(len(lines) - 1):
    prev[lines[i + 1]] = lines[i]
    next[lines[i]] = lines[i + 1]

data = "export const nav = " + \
    json.dumps({"prev": prev, "next": next}, indent=2)
open("book_links.json", "w").write(data)
