---
title: "The Curse of Dimensionality"
---

![image](https://gyazo.com/a584556b87390d4fbad2747e235a0017/thumb/1000)

- Humans find it difficult to imagine beyond 2 to 4 dimensions.
- Unexpected phenomena occur as dimensions increase.

- In [[High-Dimensional Space]], almost all points are far from the center.
    - In 1 dimension, points within distance 1 from the origin are half of those within distance 2.
    - In 2 dimensions, it's 1/4.
    - In 3 dimensions, it's 1/8.
    - ...and as dimensions increase, the proportion of "close points" decreases exponentially.

- The number of samples required for sampling increases exponentially.
    - In machine learning, increasing dimensions can actually degrade accuracy.
    - This is because the effect of insufficient sample size outweighs the accuracy improvement from adding dimensions.

![image](https://gyazo.com/934a40866acc18c6b266fdbb0c8b1ac2/thumb/1000)
[Chi-Squared Distribution - Wikipedia](https://ja.wikipedia.org/wiki/%E3%82%AB%E3%82%A4%E4%BA%8C%E4%B9%97%E5%88%86%E5%B8%83)
- In 3 or more dimensions, the mode of vector length is not zero.
    - Under the condition that each axis follows a standard normal distribution with zero as the mode.
    - [[Chi-Squared Distribution]]
    - This relates to "most points are far from the center."

- [[Almost All Vectors Are Orthogonal]]
    - [How Similar Are Vectors with High Cosine Similarity (From Iwanami Data Science Publication Event) - Mi manca qualche giovedi'?](http://d.hatena.ne.jp/n_shuyo/20160401/cosine_similarity)
    - > Among 1,000,000 samples, the proportion with a cosine similarity exceeding 1/2 is,
    - >  0.06 (about 1/17) in 10 dimensions,
    - >  0.01 (about 1/100) in 20 dimensions,
    - >  0.0021 (about 1/480) in 30 dimensions,
    - >  0.00042 (about 1/2400) in 40 dimensions,
    - > In 100 dimensions, there were no points with a cosine similarity of 1/2 or more among 1,000,000 samples.
    - Of course, in 2 dimensions, it's 33%.
- [[Cosine Similarity of 0.2 in High Dimensions Is Extremely Rare]]
- Related
    - [https://twitter.com/nishio/status/1258610796969340928?s=21](https://twitter.com/nishio/status/1258610796969340928?s=21)
    - [[Diversity]]
    - In high-dimensional space, the probability that two randomly chosen vectors are in almost the same direction is much smaller than the probability that they are almost orthogonal.
    - As dimensions (number of evaluation axes) increase, the probability that one person's skills completely surpass another's decreases.
        - 100% in 1 dimension, 50% in 2 dimensions, 25% in 3 dimensions
        - ![image](https://gyazo.com/1b7ed946d22e1cceca40118b9cc7ee6f/thumb/1000)

- [[In High-Dimensional Space, Normal Distribution Is Almost Uniform on a Hypersphere]]

- Almost all stationary points are [[Saddle Points]].
    - 99.8% in 10 dimensions

- Cases where only specific axes are large are almost nonexistent.

[[Blind Spot Card]] 19

---
This page is a high-quality translation from [/nishio/次元の呪い](https://scrapbox.io/nishio/次元の呪い). The original content is maintained by NISHIO Hirokazu.