// Giữ instance Lenis ở một chỗ duy nhất thay vì gắn vào window.
let lenis = null;

export const setLenis = (instance) => {
  lenis = instance;
};

export function scrollToId(id) {
  const target = document.getElementById(id);
  if (!target) return false;

  if (lenis) lenis.scrollTo(target);
  else target.scrollIntoView({ behavior: 'smooth' });
  return true;
}
