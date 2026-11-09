const copy = document.getElementById('copy-email');
const feedback = document.getElementById('email-feedback');
copy.addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText('by.yousefhusari@gmail.com');
    copy.textContent = 'Copied';
    feedback.textContent = 'Email address copied.';
  } catch {
    const address = document.querySelector('.email-address');
    const range = document.createRange();
    range.selectNodeContents(address);
    const selection = getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
    feedback.textContent = 'Copy the selected email address, or open Gmail.';
  }
});
