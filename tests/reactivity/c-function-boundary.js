let x = 1;
const y = x + 1; // 2

/** @param n {number} */
const increment = (n) => {
	n = n + 1;
	return n;
};

increment(x);
y; // 3 (vs 2)
