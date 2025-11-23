---
title: "Reversed Set Inclusion Relationships"
---

![image](https://gyazo.com/176ef1662ce0e681421ee8e2fbf1aa26/thumb/1000)

An example where X includes Y and Y includes X depending on the perspective:
- The set of "knowledge shared by Person A and Person B"
- Includes the set of "knowledge shared by Person A, Person B, and Person C"
- Therefore, "knowledge shared within a set of people S, denoted as f(S)," means that when S1 includes S2, f(S2) includes f(S1)
- $S_1 \subset S_2 \iff f(S_1) \supset f(S_2)$
    - This function f has the property of reversing the inclusion relationship, but Persons P and Q are unaware of the existence of this function
    - Thus, they refer to both S and f(S) with the same term, resulting in differing opinions regarding inclusion relationships

Another case where set inclusion relationships are reversed:
- [[A Encompasses B]]
- [[I Know Both, But The Other Person Knows Only One]]

[[Series Of Pictures Where Two People Say Different Things]]

Concrete example:
- "General Knowledge" and "Specialized Knowledge"
    - It might seem that "general" is broader and includes "specialized"
    - Because sometimes what is generalized and broadened is called "general"

[https://ja.wikipedia.org/wiki/共変性と反変性_(計算機科学)](https://ja.wikipedia.org/wiki/共変性と反変性_(計算機科学))
- When A is a superclass of B, A includes B
    - You can substitute B into A, but not A into B
    - Conversely, a "function that takes A as an argument" should not be substituted with a "function that takes B as an argument"
        - It is unsafe to substitute a "function that takes general animals as an argument" with a "function that takes only cats," because it might be called with a dog as an argument
        - In other words, the set inclusion relationship is reversed
        - This is called [[Contravariance]]

---
This page is a high-quality translation from [/nishio/集合の包含関係が逆](https://scrapbox.io/nishio/集合の包含関係が逆). The original content is maintained by NISHIO Hirokazu.