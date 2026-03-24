# 导航页自适应布局算法 PRD

## 背景

导航页 `.results` 容器当前固定为双列布局（`grid-template-columns: repeat(2, 1fr)`）。当各分类的 links 数量差异较大时，固定双列会导致视觉失衡——超大分类被压缩、尾部分类孤立占半行。需要一个纯函数算法，根据各分类 links 数量自动计算每个分类的列宽 span（1 或 2），使布局更美观合理。

---

## 术语定义

| 术语 | 定义 |
|------|------|
| **分类（category）** | config.json 中一个分类对象，含 `name` 和 `links[]` |
| **普通分类** | `links.length < LARGE_THRESHOLD` |
| **超大分类（large）** | `links.length >= LARGE_THRESHOLD` |
| **span** | 分类在 2 列网格中占据的列数，取值 1 或 2 |
| **独占整行** | `span = 2`，该分类横跨两列 |
| **孤单分类** | 普通分类在行中没有配对伙伴 |

---

## 算法接口

```ts
const LARGE_THRESHOLD = 8; // links 数量 >= 此值 → 超大分类

function computeLayout(
  categories: Array<{ name: string; links: Array<unknown> }>
): Array<{ name: string; span: 1 | 2 }>
```

- **输入**：过滤后的有效分类数组（与 App.jsx filteredCategories 保持一致）
- **输出**：与输入等长的结果数组，每项含 `name`（用于对应）和 `span`
- **副作用**：无（纯函数）

---

## 判定规则

### R1 超大分类规则
`links.length >= LARGE_THRESHOLD` → 初始 `span = 2`，独占整行，不参与配对。

### R2 普通分类配对规则
普通分类（`span = 1`）在网格行中两两配对，填满 2 列后进入下一行。

### R3 孤单升级规则（前置）
若当前行已有 1 个普通分类（`colFilled = 1`），下一个分类是超大分类，则行内已有的普通分类无法配对 → 升级为 `span = 2`。

### R4 孤单升级规则（末尾）
所有分类处理完后，若当前行仍有 1 个未配对的普通分类 → 升级为 `span = 2`。

### R5 单分类规则
输入仅有 1 个分类时，无论是否超大，直接 `span = 2`。

### R6 空输入
输入为空数组，返回空数组。

---

## 场景与期望输出

### 场景 1：末尾孤单分类

**输入**：`[cat1(5), cat2(4), cat3(4)]`

**推导**：
- Row1：cat1(span=1) + cat2(span=1) → 满
- Row2：cat3(span=1) → 末尾无配对 → 升级 span=2

**输出**：`[{cat1,1}, {cat2,1}, {cat3,2}]`

---

### 场景 2：超大分类居中

**输入**：`[cat1(5), cat2(4), cat3(11), cat4(3), cat5(4)]`

**推导**：
- Row1：cat1(1) + cat2(1) → 满
- Row2：cat3(large→2) → 独占，cat2 已配对不受影响
- Row3：cat4(1) + cat5(1) → 满

**输出**：`[{cat1,1}, {cat2,1}, {cat3,2}, {cat4,1}, {cat5,1}]`

---

### 场景 3：超大分类打断配对（前置孤单）

**输入**：`[cat1(5), cat3(9), cat2(4)]`

**推导**：
- Row1：cat1(1) 入行，下一个是 large → cat1 孤单 → 升级 span=2
- Row2：cat3(large→2) → 独占
- Row3：cat2(1) → 末尾孤单 → 升级 span=2

**输出**：`[{cat1,2}, {cat3,2}, {cat2,2}]`

---

### 场景 4：全部普通分类，偶数个

**输入**：`[cat1(3), cat2(5), cat3(4), cat4(2)]`

**推导**：两两配对，无孤单。

**输出**：`[{cat1,1}, {cat2,1}, {cat3,1}, {cat4,1}]`

---

### 场景 5：单个分类

**输入**：`[cat1(3)]` 或 `[cat1(10)]`

**输出**：`[{cat1,2}]`

---

### 场景 6：超大分类在首位

**输入**：`[cat1(10), cat2(3), cat3(4)]`

**推导**：
- Row1：cat1(large→2) 独占
- Row2：cat2(1) + cat3(1) → 满

**输出**：`[{cat1,2}, {cat2,1}, {cat3,1}]`

---

### 场景 7：超大分类在末尾（恰好等于阈值）

**输入**：`[cat1(3), cat2(4), cat3(8)]`（`links=8 >= LARGE_THRESHOLD=8`）

**推导**：
- Row1：cat1(1) + cat2(1) → 满
- Row2：cat3(large→2) → 独占

**输出**：`[{cat1,1}, {cat2,1}, {cat3,2}]`

---

### 场景 8：多个超大分类

**输入**：`[cat1(9), cat2(12), cat3(3)]`

**推导**：
- Row1：cat1(large→2) 独占
- Row2：cat2(large→2) 独占
- Row3：cat3(1) 末尾孤单 → 升级 span=2

**输出**：`[{cat1,2}, {cat2,2}, {cat3,2}]`

---

### 场景 9：大分类夹在孤单普通分类中间

**输入**：`[cat1(3), cat2(9), cat3(4)]`

**推导**：
- Row1：cat1(1) 入行，遇 large cat2 → cat1 孤单升级 span=2
- Row2：cat2(large→2) 独占
- Row3：cat3(1) 末尾孤单 → 升级 span=2

**输出**：`[{cat1,2}, {cat2,2}, {cat3,2}]`

---

### 场景 10：links 为 0 的分类

**输入**：`[cat1(0), cat2(3)]`

**推导**：空 links 视为普通分类，正常配对。

**输出**：`[{cat1,1}, {cat2,1}]`

---

## 算法复杂度

- 时间：O(n)，单次线性遍历 + 局部回溯最多 O(n)，整体 O(n)
- 空间：O(n)，输出数组

---

## CSS 接入方式

在 `Category` 组件上通过 `style` 传入 `grid-column: span <value>`：

```jsx
<article style={{ gridColumn: `span ${span}` }} />
```

`.results` 容器保持 `grid-template-columns: repeat(2, minmax(0, 1fr))`，由 span 控制宽度。
