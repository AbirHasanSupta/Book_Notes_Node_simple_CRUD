document.getElementById('ratingInput').addEventListener('input', function() {
    document.getElementById('ratingOutput').textContent = this.value;
});