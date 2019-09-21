$(() => {
  restore_fields();
  $('input,textarea').bind('change', () => {
    save_fields();
  });
});

function save_fields() {
  const test = {};
  // console.log(1);
  $('input,textarea').each((index, val) => {
    if (val.id !== '_csrf') {
      test[val.id] = val.value;
    }
  });
  localStorage.setItem('fields', JSON.stringify(test));
}

function restore_fields() {
  const values = JSON.parse(localStorage.getItem('fields')); // get
  for (const x in values) {
    if (values[x].length !== 0) {
      $(`#${x}`).val(values[x]);
    }
  }
}
