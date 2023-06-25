const scrollToTopButton = document.getElementById('scrollToTopButton');
const lineHeight = 15; // Adjust this value to match your desired line height
let scrollDistance = 0;

window.addEventListener('scroll', () => {
  scrollDistance = Math.round(window.scrollY / lineHeight);
  if (scrollDistance >= 15) { // Adjust the threshold as needed
    scrollToTopButton.style.display = 'block';
  } else {
    scrollToTopButton.style.display = 'none';
  }
});

scrollToTopButton.addEventListener('click', () => {
  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  });
});
