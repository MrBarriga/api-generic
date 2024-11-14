// Função para gerar um token com duas letras e quatro números
function generateCustomToken() {
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const randomLetters = letters.charAt(Math.floor(Math.random() * letters.length)) +
                        letters.charAt(Math.floor(Math.random() * letters.length));

  const randomNumbers = Math.floor(1000 + Math.random() * 9000).toString(); // Gera um número de 4 dígitos
  
  return randomLetters + randomNumbers; // Exemplo: "AB1234"
}

module.exports = { generateCustomToken };
