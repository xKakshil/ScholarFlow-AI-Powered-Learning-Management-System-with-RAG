export const SEED_DOMAIN = "scholarflow.dev";
export const SEED_PASSWORD = "Password@123";

const SAMPLE_VIDEO = "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4";

export type SeedLesson = { title: string; notes: string; videoUrl?: string };
export type SeedCourse = {
  key: string;
  instructor: "riya" | "karan";
  title: string;
  description: string;
  price: number;
  category: string;
  level: "Beginner" | "Intermediate" | "Advanced";
  monthsAgo: number;
  lessons: SeedLesson[];
};

export const INSTRUCTORS = {
  riya: { name: "Riya Sharma", email: `riya@${SEED_DOMAIN}` },
  karan: { name: "Karan Patel", email: `karan@${SEED_DOMAIN}` },
};

export const LEARNERS = [
  "Demo Student",
  "Aarav Mehta",
  "Priya Nair",
  "Rohan Gupta",
  "Sneha Rao",
  "Vikram Singh",
  "Ananya Iyer",
  "Kabir Shah",
  "Meera Joshi",
  "Arjun Das",
  "Isha Kapoor",
  "Dev Malhotra",
  "Tara Sen",
  "Nikhil Verma",
  "Pooja Reddy",
  "Aditya Kulkarni",
];

export const COURSES: SeedCourse[] = [
  {
    key: "js",
    instructor: "riya",
    title: "JavaScript: The Hard Parts",
    description:
      "Go beyond syntax and understand how JavaScript really works: closures, the event loop, promises and prototypes, with small examples you can run in the browser console.",
    price: 0,
    category: "Programming",
    level: "Intermediate",
    monthsAgo: 6,
    lessons: [
      {
        title: "Closures",
        videoUrl: SAMPLE_VIDEO,
        notes: `A closure is a function bundled together with references to its surrounding lexical scope. When a function is created inside another function, it keeps access to the outer function's variables even after the outer function has returned.

Example: function makeCounter() { let count = 0; return function () { count += 1; return count; }; } Each call to makeCounter() creates a new, private count variable. const a = makeCounter(); a(); a(); returns 1 then 2, and no other code can read or change count directly.

Why closures matter:
- Data privacy: variables captured by a closure cannot be accessed from outside, which is how JavaScript modules hid state before classes and #private fields.
- Function factories: makeMultiplier(2) and makeMultiplier(10) return different functions that each remember their own factor.
- Callbacks and event handlers: a click handler defined inside a loop or a component remembers the values it needs.
- Memoization: a cache object kept in a closure lets a function remember previous results.

Common pitfall: using var in a for loop with setTimeout prints the final value of i every time, because all callbacks share one function-scoped variable. Using let creates a new binding per iteration, so each callback closes over its own i.

Memory note: a closure keeps its captured variables alive. Holding references to large objects inside long-lived closures (for example global event listeners) can cause memory leaks.`,
      },
      {
        title: "The Event Loop and Asynchronous JavaScript",
        notes: `JavaScript runs on a single thread with one call stack. Long-running work like network requests and timers is handed to the browser or Node.js runtime, and the result comes back later as a callback. The event loop decides when those callbacks run.

How the event loop works:
1. Run all synchronous code until the call stack is empty.
2. Run every task in the microtask queue: promise reactions (.then, .catch, await continuations) and queueMicrotask callbacks.
3. Take one task from the macrotask (task) queue, such as a setTimeout callback, an I/O callback or a UI event, and run it.
4. Repeat. Rendering in browsers happens between tasks.

Classic question: console.log('A'); setTimeout(() => console.log('B'), 0); Promise.resolve().then(() => console.log('C')); console.log('D'); prints A, D, C, B. A and D are synchronous. C is a microtask, so it runs as soon as the stack is empty. B is a macrotask, so it waits for the next turn of the loop even with a 0 ms delay.

Blocking the event loop: a long synchronous loop (for example parsing a huge JSON file) freezes the page because no other callbacks or rendering can run until it finishes. Split heavy work into chunks, use Web Workers in the browser, or worker_threads in Node.js.`,
      },
      {
        title: "Promises and async/await",
        notes: `A promise represents a value that will be available in the future. It is in one of three states: pending, fulfilled (resolved with a value) or rejected (with an error). Once settled, a promise never changes state.

Chaining: fetch(url).then(res => res.json()).then(data => render(data)).catch(err => showError(err)). Each .then returns a new promise, so steps run in order, and a single .catch at the end handles an error from any step.

async/await is syntax on top of promises. An async function always returns a promise. Inside it, await pauses that function (not the whole program) until the promise settles, which makes asynchronous code read like synchronous code. Use try/catch around await to handle rejections.

Running work in parallel:
- Promise.all([p1, p2]) waits for all promises and rejects as soon as any one rejects.
- Promise.allSettled returns the result of every promise, whether fulfilled or rejected.
- Promise.race settles with the first promise to settle; Promise.any with the first to fulfil.

Common mistake: awaiting inside a for loop makes requests run one after another. If the requests are independent, start them all and await Promise.all instead, which is much faster.

Always handle rejections. An unhandled rejected promise logs a warning in browsers and can crash a Node.js process.`,
      },
      {
        title: "Prototypes and the this Keyword",
        notes: `Every JavaScript object has an internal link to another object called its prototype. When you read a property that the object does not have, JavaScript looks it up the prototype chain until it finds it or reaches null. This is prototypal inheritance.

class syntax is mostly a cleaner way to write prototype-based code: methods defined in a class body are stored once on ClassName.prototype and shared by every instance, which saves memory compared with creating functions inside the constructor.

The value of this is decided by how a function is called, not where it is defined:
- obj.method(): this is obj.
- A plain function call fn(): this is undefined in strict mode (or the global object in sloppy mode).
- new Fn(): this is the newly created object.
- fn.call(x), fn.apply(x) and fn.bind(x): this is x.
- Arrow functions do not have their own this; they use this from the surrounding scope.

Common bug: passing a method as a callback, such as setTimeout(obj.greet, 100), loses this because the method is called as a plain function. Fix it with obj.greet.bind(obj) or an arrow function: setTimeout(() => obj.greet(), 100).`,
      },
    ],
  },
  {
    key: "dsa",
    instructor: "riya",
    title: "Data Structures in Python",
    description:
      "Master the data structures behind every coding interview: lists, stacks, queues, hash maps and trees, with Big-O analysis and Python examples.",
    price: 499,
    category: "Programming",
    level: "Beginner",
    monthsAgo: 5,
    lessons: [
      {
        title: "Lists and Big-O Notation",
        videoUrl: SAMPLE_VIDEO,
        notes: `Big-O notation describes how the running time or memory of an algorithm grows as the input size n grows, ignoring constants. Common classes from fastest to slowest: O(1) constant, O(log n) logarithmic, O(n) linear, O(n log n), O(n^2) quadratic, O(2^n) exponential.

A Python list is a dynamic array: elements sit next to each other in memory.
- Index access lst[i] is O(1).
- append is amortised O(1): when the array is full Python allocates a bigger one and copies, but this happens rarely enough that the average cost stays constant.
- insert(0, x) and pop(0) are O(n) because every other element must shift.
- x in lst is O(n) because it scans the list.
- Sorting with sorted() or .sort() is O(n log n) (Timsort).

Rule of thumb: if you check membership often, use a set or dict (average O(1)) instead of a list. If you add and remove at both ends, use collections.deque.`,
      },
      {
        title: "Stacks and Queues",
        notes: `A stack is Last-In-First-Out (LIFO): the last item pushed is the first popped. In Python, use a list: append() to push and pop() to pop, both O(1). Stacks are used for undo history, the function call stack, depth-first search and checking balanced brackets.

Balanced brackets example: scan the string; push every opening bracket; on a closing bracket, pop and check that it matches. The string is balanced if every closing bracket matches and the stack is empty at the end.

A queue is First-In-First-Out (FIFO): items leave in the order they arrived. Do not use list.pop(0) for queues because it is O(n). Use collections.deque with append() and popleft(), both O(1). Queues are used for breadth-first search, task scheduling and buffering requests.

A priority queue always returns the smallest (or most important) item first. Python's heapq module implements a binary min-heap: heappush and heappop are O(log n), and reading the smallest item heap[0] is O(1).`,
      },
      {
        title: "Hash Maps (Dictionaries)",
        notes: `A hash map stores key-value pairs. A hash function turns each key into an index in an internal array, so lookups, inserts and deletes take O(1) time on average. Python's dict and set are hash tables.

Collisions happen when two keys hash to the same slot. Python resolves them with open addressing (probing for another free slot). With a good hash function and a table that is resized as it fills up, collisions stay rare, so operations stay O(1) on average; the worst case is O(n).

Keys must be hashable, which means immutable: strings, numbers and tuples work; lists and dicts do not.

Classic interview pattern, Two Sum: to find two numbers that add up to a target, walk through the list once and store each number's index in a dict. For each number x, check whether target - x is already in the dict. This turns an O(n^2) nested loop into an O(n) solution.

Useful tools: collections.Counter counts items, defaultdict avoids KeyError when grouping, and dict preserves insertion order in Python 3.7+.`,
      },
      {
        title: "Trees, BFS and DFS",
        notes: `A tree is a hierarchical structure of nodes with one root, where every node except the root has exactly one parent. A binary tree has at most two children per node (left and right).

A binary search tree (BST) keeps all smaller values in the left subtree and larger values in the right subtree. Search, insert and delete take O(h), where h is the height: O(log n) when the tree is balanced, but O(n) when it degenerates into a chain, which is why self-balancing trees like AVL and red-black trees exist.

Depth-first search (DFS) goes as deep as possible before backtracking. It is naturally written with recursion (or an explicit stack). Traversal orders: preorder (node, left, right), inorder (left, node, right; gives sorted order in a BST) and postorder (left, right, node).

Breadth-first search (BFS) visits nodes level by level using a queue (collections.deque). BFS finds the shortest path in an unweighted graph and is used for level-order traversal.

Both BFS and DFS visit every node once, so they run in O(n) time.`,
      },
    ],
  },
  {
    key: "sql",
    instructor: "karan",
    title: "SQL for Developers",
    description:
      "Write SQL with confidence: querying, joins, indexes and transactions in PostgreSQL, explained the way backend developers actually use them.",
    price: 299,
    category: "Databases",
    level: "Beginner",
    monthsAgo: 4,
    lessons: [
      {
        title: "SELECT, WHERE and ORDER BY",
        videoUrl: SAMPLE_VIDEO,
        notes: `SELECT reads data from tables. SELECT name, email FROM users WHERE role = 'LEARNER' ORDER BY created_at DESC LIMIT 10; returns the ten newest learners.

The logical order in which SQL evaluates a query is different from the order you write it: FROM (and JOINs), then WHERE, then GROUP BY, then HAVING, then SELECT, then ORDER BY, then LIMIT. This is why you cannot use a column alias defined in SELECT inside WHERE.

WHERE filters rows before grouping. Useful operators: =, <>, <, >, BETWEEN, IN (...), LIKE 'abc%' for pattern matching (ILIKE is case-insensitive in PostgreSQL) and IS NULL. Note that NULL = NULL is not true; always use IS NULL or IS NOT NULL.

Aggregates such as COUNT, SUM, AVG, MIN and MAX summarise rows. GROUP BY creates one group per distinct value, and HAVING filters groups after aggregation, for example SELECT course_id, COUNT(*) FROM enrollments GROUP BY course_id HAVING COUNT(*) > 5.`,
      },
      {
        title: "JOINs Explained",
        notes: `A JOIN combines rows from two tables using a related column, usually a foreign key.

- INNER JOIN returns only rows that have a match in both tables. Example: enrollments joined to users returns only enrollments whose user exists.
- LEFT JOIN returns every row from the left table, with NULLs for columns from the right table when there is no match. Use it to find things with no related rows: SELECT c.title FROM courses c LEFT JOIN enrollments e ON e.course_id = c.id WHERE e.id IS NULL finds courses nobody has enrolled in.
- RIGHT JOIN is the mirror image of LEFT JOIN and is rarely needed.
- FULL OUTER JOIN returns all rows from both sides, matched where possible.
- CROSS JOIN returns every combination of rows (a Cartesian product), which is usually a mistake unless you need it deliberately.

Joining one row to many rows multiplies the result: a course with 50 enrollments appears 50 times. Be careful when you SUM after a join, because values can be counted more than once.

The N+1 query problem: fetching a list of courses and then running a separate query for each course's instructor causes N+1 round trips. A single JOIN (or an ORM include) fetches everything in one query.`,
      },
      {
        title: "Indexes and Query Performance",
        notes: `An index is a separate data structure that lets the database find rows without scanning the whole table, like the index at the back of a book. PostgreSQL's default index type is a B-tree, which supports equality and range queries (=, <, >, BETWEEN, ORDER BY) in O(log n).

Create one with CREATE INDEX idx_enrollments_user ON enrollments(user_id). Primary keys and UNIQUE constraints are indexed automatically, but foreign keys are not, so index foreign key columns you join or filter on.

Trade-offs: indexes speed up reads but slow down writes, because every INSERT, UPDATE and DELETE must also update each index, and they use extra disk space. Do not index every column.

Composite indexes on (a, b) help queries that filter on a, or on a and b together, but generally not on b alone. Put the most selective, most commonly filtered column first.

Use EXPLAIN ANALYZE before a query to see the actual plan. A "Seq Scan" on a large table for a selective filter often means a missing index; an "Index Scan" means the index is being used.`,
      },
      {
        title: "Transactions and ACID",
        notes: `A transaction groups several statements so that they succeed or fail together. BEGIN; UPDATE accounts SET balance = balance - 100 WHERE id = 1; UPDATE accounts SET balance = balance + 100 WHERE id = 2; COMMIT; Either both updates happen or, after ROLLBACK or an error, neither does.

ACID properties:
- Atomicity: all statements in a transaction are applied, or none are.
- Consistency: a transaction moves the database from one valid state to another, respecting constraints.
- Isolation: concurrent transactions do not see each other's partial work. PostgreSQL's default isolation level is READ COMMITTED; REPEATABLE READ and SERIALIZABLE give stronger guarantees at the cost of more retries.
- Durability: once committed, data survives crashes because it is written to the write-ahead log.

Race condition example: two requests read stock = 1 and both sell the item. Prevent it with SELECT ... FOR UPDATE to lock the row, with an atomic UPDATE products SET stock = stock - 1 WHERE id = 1 AND stock > 0, or with a higher isolation level.

Keep transactions short: long transactions hold locks and block other users.`,
      },
    ],
  },
  {
    key: "ml",
    instructor: "karan",
    title: "Introduction to Machine Learning",
    description:
      "Learn the core ideas of machine learning without heavy maths: supervised learning, overfitting and how to evaluate a model honestly.",
    price: 799,
    category: "AI",
    level: "Intermediate",
    monthsAgo: 3,
    lessons: [
      {
        title: "Supervised Learning Basics",
        videoUrl: SAMPLE_VIDEO,
        notes: `Supervised learning trains a model on labelled examples: inputs (features) paired with the correct output (label). The model learns a mapping from features to labels so it can predict labels for new, unseen inputs.

Two main problem types:
- Regression predicts a continuous number, such as a house price or delivery time. Linear regression fits a straight line (or plane) that minimises the mean squared error between predictions and true values.
- Classification predicts a category, such as spam or not spam. Logistic regression, decision trees, random forests and neural networks are common classifiers.

The training process: choose a model, define a loss function that measures how wrong predictions are, and use an optimisation algorithm such as gradient descent to adjust the model's parameters to reduce the loss. The learning rate controls how big each update step is: too large and training diverges, too small and it is very slow.

Always split data into a training set (to fit the model) and a test set (held back to estimate performance on new data). A typical split is 80/20. Never tune your model on the test set.`,
      },
      {
        title: "Overfitting, Underfitting and Regularization",
        notes: `Overfitting happens when a model learns the training data too well, including its noise, so it performs well on training data but badly on new data. A sign of overfitting is low training error with much higher validation error.

Underfitting is the opposite: the model is too simple to capture the pattern, so both training and validation error are high.

This is the bias-variance trade-off. High bias (too simple) leads to underfitting; high variance (too flexible) leads to overfitting. The goal is the sweet spot with the lowest validation error.

Ways to reduce overfitting:
- Get more training data.
- Use a simpler model or fewer features.
- Regularization adds a penalty for large weights to the loss: L2 (Ridge) shrinks all weights, and L1 (Lasso) can shrink some to exactly zero, which also performs feature selection.
- Dropout in neural networks randomly turns off neurons during training.
- Early stopping halts training when validation error starts rising.
- Cross-validation (for example k-fold with k = 5) gives a more reliable estimate of performance than a single split.`,
      },
      {
        title: "Evaluating Classification Models",
        notes: `Accuracy (correct predictions divided by all predictions) is misleading on imbalanced data. If 99% of transactions are legitimate, a model that always predicts "legitimate" is 99% accurate but useless for catching fraud.

The confusion matrix counts true positives (TP), false positives (FP), true negatives (TN) and false negatives (FN).

- Precision = TP / (TP + FP): of everything the model flagged as positive, how much really was positive. Optimise precision when false alarms are costly, such as a spam filter hiding real email.
- Recall = TP / (TP + FN): of all real positives, how many the model found. Optimise recall when missing a positive is costly, such as cancer screening or fraud detection.
- F1 score is the harmonic mean of precision and recall, useful when you need a balance between the two.

Most classifiers output a probability, and the decision threshold (often 0.5) trades precision against recall: raising it increases precision and lowers recall. The ROC curve plots the true positive rate against the false positive rate across thresholds, and ROC-AUC summarises it in one number, where 0.5 is random guessing and 1.0 is perfect.`,
      },
    ],
  },
];
