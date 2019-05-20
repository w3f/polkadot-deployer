
module.exports = {
  create: (data) => {
    let template = `$data << EOD`;

    data.forEach((item) => {
      const mean = item.results.reduce((a,b) => a + b, 0) / item.results.length;
      const min = Math.min(...item.results);
      const max = Math.max(...item.results);
      template += `
${item.validators} ${mean} ${min} ${max}`
    });

    template += `
EOD
set terminal png
set output "benchmark.png"
set xlabel "Number of validators"
set ylabel "Time to finality (msec)"
set grid

plot "$data" with yerrorlines title "Block finality time"
`;
    return template
  }
}
