import fs from 'fs';
let c = fs.readFileSync('D:\\myweb\\jhfyjxpt\\src\\components\\ShopPanel.tsx', 'utf8');

// Add useEffect import if not present
if (!c.includes('useEffect')) {
  c = c.replace('import { useState, useCallback, useMemo, type ChangeEvent }', 'import { useState, useCallback, useEffect, useMemo, type ChangeEvent }');
}

// Rename static products to seedProducts and make it unused
c = c.replace('const products: Product[] = [', 'const seedProducts: __unused: Product[] = ['); 
c = c.replace('const seedProducts: Product[] = [', 'const _seedProducts: Product[] = [');

// Replace productList init to empty
c = c.replace('const [productList, setPL] = useState<Product[]>([])', 'const [productList, setPL] = useState<Product[]>([] as Product[])');

// Fix the productList state that was using products - replace with empty init
c = c.replace('const [productList, setPL] = useState<Product[]>([])', 'const [productList, setPL] = useState<Product[]>([])');

// Wait, the double replace is wrong. Let me just check.
// Actually, the state should be [productList, setPL] = useState<Product[]>([])
// But the current code has: const [productList, setPL] = useState<Product[]>([])
// Already empty. Let me check.

// The problem: filtered and cartTotal originally used the static `products` variable
// Now they should use productList. Let me check references.
const prodRefs = [];
let i = -1;
while ((i = c.indexOf('products.', i + 1)) !== -1) {
  const line = c.slice(Math.max(0, i - 40), i + 40).split('\n').pop() || '';
  prodRefs.push(line.trim());
}
console.log('products. references (after static array removal):');
prodRefs.forEach(r => console.log(' ', r));

fs.writeFileSync('D:\\myweb\\jhfyjxpt\\src\\components\\ShopPanel.tsx', c, 'utf8');
console.log('Checked. File size:', c.length);
