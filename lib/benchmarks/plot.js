
module.exports = {
  create: (data) => {
    let template = `$data << EOD`;

    data.forEach((item) => {
      template += `
${item.validators} ${item.results.join(" ")}
`
    });

    template += `EOD
set terminal png
set output "main.png"

plot "$data" \
  with linespoints \
  title "benchmark"
`;
    return template
  }
}
