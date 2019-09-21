
$(document).ready(() => {
  let page_num = 1;
  $('#next').click(() => {
    page_num++;
    update(page_num);
  });
  $('#previous').click(() => {
    if (page_num > 1) {
      page_num--;
      update(page_num);
    }
  });
  $('#zip, #dist').on('change', () => {
    update(page_num);
  });
  const t = $('#zip');
  t.val(localStorage.getItem('zipcode'));

  if (t.val().length === 0) {
    $('#default').remove();
    $('#block').append('<div class="jumbotron" id="default"><div class="h2">Use the zipcode locator to find plants near you!</div></div>');
  } else {
    add(t.val(), 1);
  }
});

function add(zip, page) {
  let lng = 0;
  let lat = 0;
  $('#default').remove();
  $('#block').append('<div class="jumbotron" id="default"><div class="p">Loading...</div></div>');
    $.ajax({
      type: 'GET',
      dataType: 'json',
      url: `/api/loan?page=${page - 1}`,
      contentType: 'application/json; charset=utf-8',
      success(plant_msg) {
        if (plant_msg.length !== 0) {
          $('#default').remove();
          $('#icon_1').attr('style', 'color:green');
          Object.keys(plant_msg).forEach((key) => {
            console.log(plant_msg);
            $('#block').append(`${'<div class=\'col-sm-3\'>' +
                                '<div class=\'panel panel-default\' onclick="location.href=\''}${plant_msg[key].page}\';"><div class='panel-body'><h2>${plant_msg[key].loanTitle}</h2> <p>${plant_msg[key].loanDescription}</p> <p><a class='btn btn-default' href=${plant_msg[key].page}>View details »</a></p></div></div></div> `);
          });
        } else {
          $('#default').remove();
          $('#block').append('<div class="jumbotron" id="default"><div class="h2">No one has posted any plants in your area!</div><p>You can be the first one to post!</p></div>');
        }
      },
    });

}

function update(page) {
  $('#current_page').text(`Page ${page}`);
  const zip = $('#zip');
  $('#icon_1').attr('style', 'display:none');
  $('#icon_2').attr('style', '');
  localStorage.setItem('zipcode', zip.val());
  if (zip.val().length === 5) {
    $('#block').empty();
    add(zip.val(), page);
  }
}
