
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
  $('#search').on('change', () => {
    update(page_num);
  });
  const t = $('#search');
  t.val(localStorage.getItem('search'));
  add(t.val(), 1);
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
            console.log(plant_msg[key]);
            var loanProg = (plant_msg[key].amountLoaned)/(plant_msg[key].amountWanted);
            if (loanProg>1){
              loanProg = 1;
            }
            console.log(loanProg);
            $('#block').append(`${'<div class=\'col-sm-3\' style = \'max-height: 50vh; overflow-y: auto\'>' +
                                '<div class=\'panel panel-default\' onclick="location.href=\''}${plant_msg[key].page}\';">
                                <div class='panel-body'><h2>${plant_msg[key].loanTitle}</h2>
                                <p>${plant_msg[key].loanDescription}</p>
                                <div class = 'progress'><div class='progress-bar' style = 'width: ${loanProg*=100}%; background-color:#6666e0;' role='progressbar' aria-valuenow=${loanProg} aria-valuemin='0' aria-valuemax='1'></div></div>                          
                                <p><a class='btn btn-default longbtn' href=${plant_msg[key].page}>Support Now »</a></p></div></div></div> `);
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
  const search = $('#search');
  $('#icon_1').attr('style', 'display:none');
  $('#icon_2').attr('style', '');
  localStorage.setItem('search', search.val());
  if (search.val().length > 2) {
    $('#block').empty();
    add(search.val(), page);
  }
}
