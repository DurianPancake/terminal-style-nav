import { describe, it, expect } from 'vitest';
import { computeLayout, LARGE_THRESHOLD } from '../computeLayout';

// Helper: build category input
const cat = (name, linkCount) => ({
  name,
  links: Array.from({ length: linkCount }, (_, i) => ({ name: `link${i}`, url: `https://x.com/${i}` })),
});

// Helper: build expected result
const res = (name, span) => ({ name, span });

describe('computeLayout', () => {
  // ── 常量验证 ─────────────────────────────────────────────
  it('LARGE_THRESHOLD 应为 8', () => {
    expect(LARGE_THRESHOLD).toBe(8);
  });

  // ── 场景 1：末尾孤单分类 ──────────────────────────────────
  describe('场景1：末尾孤单分类', () => {
    it('cat1(5) + cat2(4) + cat3(4) → cat3 升级为 span=2', () => {
      const input = [cat('cat1', 5), cat('cat2', 4), cat('cat3', 4)];
      expect(computeLayout(input)).toEqual([
        res('cat1', 1),
        res('cat2', 1),
        res('cat3', 2),
      ]);
    });
  });

  // ── 场景 2：超大分类居中 ───────────────────────────────────
  describe('场景2：超大分类居中', () => {
    it('cat1(5)+cat2(4)+cat3(11)+cat4(3)+cat5(4) → cat3 独占行', () => {
      const input = [
        cat('cat1', 5),
        cat('cat2', 4),
        cat('cat3', 11),
        cat('cat4', 3),
        cat('cat5', 4),
      ];
      expect(computeLayout(input)).toEqual([
        res('cat1', 1),
        res('cat2', 1),
        res('cat3', 2),
        res('cat4', 1),
        res('cat5', 1),
      ]);
    });
  });

  // ── 场景 3：超大分类打断配对 ───────────────────────────────
  describe('场景3：超大分类打断配对，前一普通分类孤单升级', () => {
    it('cat1(5) + cat3(9) + cat2(4) → cat1 升级，cat2 末尾升级', () => {
      const input = [cat('cat1', 5), cat('cat3', 9), cat('cat2', 4)];
      expect(computeLayout(input)).toEqual([
        res('cat1', 2),
        res('cat3', 2),
        res('cat2', 2),
      ]);
    });
  });

  // ── 场景 4：全部普通分类，偶数个 ──────────────────────────
  describe('场景4：全部普通分类，偶数个', () => {
    it('4 个普通分类 → 两两配对 span=1', () => {
      const input = [cat('cat1', 3), cat('cat2', 5), cat('cat3', 4), cat('cat4', 2)];
      expect(computeLayout(input)).toEqual([
        res('cat1', 1),
        res('cat2', 1),
        res('cat3', 1),
        res('cat4', 1),
      ]);
    });
  });

  // ── 场景 5：单个分类 ──────────────────────────────────────
  describe('场景5：单个分类', () => {
    it('单个普通分类 → span=2', () => {
      expect(computeLayout([cat('cat1', 3)])).toEqual([res('cat1', 2)]);
    });

    it('单个超大分类 → span=2', () => {
      expect(computeLayout([cat('cat1', 10)])).toEqual([res('cat1', 2)]);
    });
  });

  // ── 场景 6：超大分类在首位 ────────────────────────────────
  describe('场景6：超大分类在首位', () => {
    it('cat1(10)+cat2(3)+cat3(4) → cat1 独占，cat2/cat3 配对', () => {
      const input = [cat('cat1', 10), cat('cat2', 3), cat('cat3', 4)];
      expect(computeLayout(input)).toEqual([
        res('cat1', 2),
        res('cat2', 1),
        res('cat3', 1),
      ]);
    });
  });

  // ── 场景 7：超大分类在末尾（恰好等于阈值）────────────────
  describe('场景7：超大分类末尾，links 数 == LARGE_THRESHOLD', () => {
    it('cat1(3)+cat2(4)+cat3(8) → cat1/cat2 配对，cat3 独占', () => {
      const input = [cat('cat1', 3), cat('cat2', 4), cat('cat3', 8)];
      expect(computeLayout(input)).toEqual([
        res('cat1', 1),
        res('cat2', 1),
        res('cat3', 2),
      ]);
    });
  });

  // ── 场景 8：多个超大分类 ──────────────────────────────────
  describe('场景8：多个超大分类', () => {
    it('cat1(9)+cat2(12)+cat3(3) → 两个大分类各独占，cat3 末尾孤单升级', () => {
      const input = [cat('cat1', 9), cat('cat2', 12), cat('cat3', 3)];
      expect(computeLayout(input)).toEqual([
        res('cat1', 2),
        res('cat2', 2),
        res('cat3', 2),
      ]);
    });

    it('cat1(8)+cat2(8) → 两个大分类各独占', () => {
      const input = [cat('cat1', 8), cat('cat2', 8)];
      expect(computeLayout(input)).toEqual([
        res('cat1', 2),
        res('cat2', 2),
      ]);
    });
  });

  // ── 场景 9：空输入 ─────────────────────────────────────────
  describe('场景9：空输入', () => {
    it('空数组 → 返回空数组', () => {
      expect(computeLayout([])).toEqual([]);
    });
  });

  // ── 场景 10：两个普通分类 ──────────────────────────────────
  describe('场景10：两个普通分类', () => {
    it('cat1(3)+cat2(5) → 正常配对 span=1', () => {
      const input = [cat('cat1', 3), cat('cat2', 5)];
      expect(computeLayout(input)).toEqual([
        res('cat1', 1),
        res('cat2', 1),
      ]);
    });
  });

  // ── 场景 11：大分类前后都有孤单普通分类 ───────────────────
  describe('场景11：大分类夹在孤单普通分类中间', () => {
    it('cat1(3)+cat2(9)+cat3(4) → cat1 前置孤单升级，cat2 独占，cat3 末尾升级', () => {
      const input = [cat('cat1', 3), cat('cat2', 9), cat('cat3', 4)];
      expect(computeLayout(input)).toEqual([
        res('cat1', 2),
        res('cat2', 2),
        res('cat3', 2),
      ]);
    });
  });

  // ── 场景 12：links 为 0 ────────────────────────────────────
  describe('场景12：links 为空的分类', () => {
    it('空 links 分类视为普通分类，参与正常布局', () => {
      const input = [cat('cat1', 0), cat('cat2', 3)];
      expect(computeLayout(input)).toEqual([
        res('cat1', 1),
        res('cat2', 1),
      ]);
    });
  });
});
