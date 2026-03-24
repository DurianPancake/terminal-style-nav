/**
 * 布局算法：根据各分类 links 数量自动计算网格列宽 span（1 或 2）
 *
 * 规则：
 * 1. links >= LARGE_THRESHOLD → span=2（独占整行）
 * 2. 模拟行填充：large 分类独占一行；普通分类两两配对
 * 3. 若一个普通分类前后紧邻 large 分类（或列表边界），导致它无法配对 → 升级为 span=2
 * 4. 最终遍历完后若最后一个 span=1 的分类没有配对 → 升级为 span=2
 */

export const LARGE_THRESHOLD = 8;

/**
 * @param {Array<{ name: string, links: Array }>} categories
 * @returns {Array<{ name: string, span: 1|2 }>}
 */
export function computeLayout(categories) {
  if (categories.length === 0) return [];
  if (categories.length === 1) return [{ name: categories[0].name, span: 2 }];

  // Step 1: 初始 span 分配（large → 2，其余 → 1）
  const spans = categories.map((cat) => ({
    name: cat.name,
    span: cat.links.length >= LARGE_THRESHOLD ? 2 : 1,
  }));

  // Step 2: 模拟行填充，检测孤单普通分类并升级
  // 遍历 spans，跟踪当前行已占列数
  let colFilled = 0; // 当前行已填充列数（0 或 1）

  for (let i = 0; i < spans.length; i++) {
    const s = spans[i];

    if (s.span === 2) {
      // large 分类：若当前行已有 1 列，前面那个普通分类升级
      if (colFilled === 1) {
        // 找上一个 span=1 的并升级
        for (let j = i - 1; j >= 0; j--) {
          if (spans[j].span === 1) {
            spans[j].span = 2;
            break;
          }
        }
      }
      // large 分类独占整行，重置
      colFilled = 0;
    } else {
      // 普通分类
      colFilled += 1;
      if (colFilled === 2) colFilled = 0; // 配对完成，行满
    }
  }

  // Step 3: 末尾孤单检测（遍历结束后 colFilled === 1 说明最后一个 span=1 没有配对）
  if (colFilled === 1) {
    for (let j = spans.length - 1; j >= 0; j--) {
      if (spans[j].span === 1) {
        spans[j].span = 2;
        break;
      }
    }
  }

  return spans;
}
