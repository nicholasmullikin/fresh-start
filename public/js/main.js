
const cropper_functions = [];
$(() => {
  if (window.location.pathname === '/account') {
    document.getElementById('location_button').addEventListener('click', () => {
      const element = document.getElementById('location');
      element.placeholder = 'Loading';
      if (navigator.geolocation) {
        element.placeholder += '...';
        navigator.geolocation.getCurrentPosition((position) => {
          const lat = position.coords.latitude;
          const lon = position.coords.longitude;
          $.ajax({
            type: 'GET',
            dataType: 'json',
            url: `http://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}`,
            contentType: 'text/plain; charset=utf-8',
            success(msg) {
              element.value = msg.address.postcode;
            },
          });
        });
      }
    });
    $('#location').blur(() => {
      const inputZip = $('#location').val().replace(/[^0-9]/g, '');
      $.ajax({
        type: 'GET',
        dataType: 'json',
        url: `https://nominatim.openstreetmap.org/search?format=json&addressdetails=0&postalcode=${inputZip}`,
        contentType: 'text/plain; charset=utf-8',
        success(msg) {
          $('#lng').val(msg[0].lon);
          $('#lat').val(msg[0].lat);
        },
      });
    });
    $('#password,#confirmPassword').delay(100).queue(function(nxt) {
      $(this).removeAttr('readonly');
      nxt();
    });
  }
  if (window.location.pathname === '/loan/new') {
    $('#email_radio').click(() => {
      $('#op1').attr('style', '');
      $('#op2').attr('style', 'display:none;');
      $('#email').attr('required', '');
      $('#phone_number').removeAttr('required', '');
    });
    $('#phone_radio').click(() => {
      $('#op1').attr('style', 'display:none;');
      $('#op2').attr('style', '');
      $('#email').removeAttr('required', '');
      $('#phone_number').attr('required', '');
    });
    $('#both_radio').click(() => {
      $('#op1').attr('style', '');
      $('#op2').attr('style', '');
      $('#email').attr('required', '');
      $('#phone_number').attr('required', '');
    });
  }
  if (/plant\/edit\//.test(window.location.pathname)) {
    $('.del-img').click(function() {
      const id = this.getAttribute('id');
      const element = document.getElementById('files_deleted');
      if (element.value.length !== 0) {
        element.value = element.value.substring(1, element.value.length - 1);
        element.value += ',';
      }
      element.value += `"${document.getElementById(`img-${id}`).attributes.src.value}"`;
      element.value = `[${element.value}]`;
      console.log(element.value);


      $(`#${id}`).parent().parent().remove();
      // $('#img-' + id).remove();
      if ($('img').length < 1) {
        $('#img-group').remove();
      }
    });
    document.getElementById('del-btn').addEventListener('click', () => {
      $.ajax({
        url: window.location.pathname,
        type: 'DELETE',
        error(err) {
          if (err.status === 303) {
            window.location.replace('/');
          } else {
            window.location.reload();
          }
        },
      });
    });
    $('#zipcode').keyup(function(e) {
      console.log(e);
      if (!(/(^\d{5}$)|(^\d{5}-\d{4}$)/.test(this.value))) {
        e.target.setCustomValidity('Zipcode is not valid');
      } else {
        e.target.setCustomValidity('');
      }
    });


    $.ajax({
      type: 'GET',
      dataType: 'json',
      url: `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${$('#lat').val()}&lon=${$('#lng').val()}`,
      contentType: 'text/plain; charset=utf-8',
      success(msg) {
        if (typeof msg !== 'undefined' && typeof msg.address !== 'undefined') {
          $('#zipcode').val(msg.address.postcode);
        }
      },
    });
    $('#zipcode').val().replace(/[^0-9]/g, '');

    $('#zipcode').blur(() => {
      const inputZip = $('#zipcode').val().replace(/[^0-9]/g, '');
      $.ajax({
        type: 'GET',
        dataType: 'json',
        url: `https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=0&postalcode=${inputZip}`,
        contentType: 'text/plain; charset=utf-8',
        success(msg) {
          if (typeof msg !== 'undefined') {
            $('#lng').val(msg[0].lon);
            $('#lat').val(msg[0].lat);
          }
        },
      });
    });
  }
  if (/plant\/editUpload\//.test(window.location.pathname)) {
    $('.del-img').click(function() {
      const id = this.getAttribute('id');
      const element = document.getElementById('files_deleted');
      if (element.value.length !== 0) {
        element.value = element.value.substring(1, element.value.length - 1);
        element.value += ',';
      }
      element.value += `"${document.getElementById(`img-${id}`).attributes.src.value}"`;
      element.value = `[${element.value}]`;
      console.log(element.value);


      $(`#${id}`).parent().parent().remove();
      // $('#img-' + id).remove();
      if ($('img').length < 1) {
        $('#img-group').remove();
      }
    });
    document.getElementById('add-img').addEventListener('click', () => {
      const element = $('#last-upload');
      element.after('<input name="gallery" type="file" id="last-upload">');
      element.removeAttr('id');
      if ($('input[name=\'gallery\']').length >= 6) {
        $('#add-img').remove();
      }
    });
    // document.getElementById("del-btn").addEventListener('click', function () {
    //     $.ajax({
    //         url: window.location.pathname,
    //         type: 'DELETE',
    //         error: function (err) {
    //             if (err.status === 303) {
    //                 window.location.replace("/");
    //             }
    //             else {
    //                 window.location.reload();
    //             }
    //         }
    //     });
    // });
  }
  if (/plant\/upload\//.test(window.location.pathname)) {
    $('#next,#back').hide();
    if (window.File && window.FileReader && window.FileList && window.Blob) {
      let page = 0;
      let page_limit = 0;

      $('#filesToUpload').change(() => {
        $('#skip').hide();
        page = 0;
        page_limit = 0;
        $('#next').show();
        const {files} = $('#filesToUpload')[0];
        const temp_function_array = [];
        for (let i = 0; i < files.length; i++) {
          temp_function_array[i] = resizeAndUpload(files[i], i);
        }
        parallel(temp_function_array).then((cropper_functions) => {
          $(`.image_${0}`).show();
          // $("#back").show();
          page_limit = files.length;

          $('#submit').click(() => {
            get_all_blobs(cropper_functions).then((blobs) => {
              // console.log(blobs);
              const formData = new FormData();
              formData.append('_csrf', $('#_csrf').val());
              for (let i = 0; i < blobs.length; i++) {
                formData.append('gallery', blobs[i]);
              }
              console.log(formData);
              $.ajax(window.location.pathname, {
                method: 'POST',
                data: formData,
                processData: false,
                contentType: false,
                cache: false,
                success() {
                  window.location = '/plant/postings';
                },
                error() {
                  window.location.reload();
                },
              });
            });
          });


          /* cropper.getCroppedCanvas().toBlob((blob) => {
                        const formData = new FormData();

                        formData.append('croppedImage', blob);

                        // Use `jQuery.ajax` method
                        $.ajax('/path/to/upload', {
                            method: "POST",
                            data: formData,
                            processData: false,
                            contentType: false,
                            success() {
                                console.log('Upload success');
                            },
                            error() {
                                console.log('Upload error');
                            },
                        });
                    }); */

          $('#next,#back').click((event) => {
            if (event.target.id === 'back') {
              if (page > 0) {
                page--;
              }
            } else if (event.target.id === 'next') {
              if (page < page_limit - 1) {
                page++;
              }
            }

            if (page > 0) {
              $('#back').show();
            } else {
              $('#back').hide();
            }

            if (page === page_limit - 1) {
              $('#next').hide();
              $('#submit').removeAttr('disabled');
            }


            $(`.image_${page}`).show();
            $(`.image_${page + 1}`).hide();
            $(`.image_${page - 1}`).hide();
          });
        });
      });
    } else {
      alert('The File APIs are not fully supported in this browser.');
    }
  }
  if (window.location.pathname === '/loan/postings') {
    $('button').click(function() {
      if (this.hasAttribute('id')) {
        if (this.getAttribute('id').length === 24) {
          const id = this.getAttribute('id');
          $('#each_posting').text($(`#name_${this.getAttribute('id')}`).text());
          $('#del-btn').click(() => {
            delete_posting(`/loan/edit/${id}`);
          });
        }
      }
    });
  }
});



function onSubmit(token) {
  console.log(token);
  document.getElementById('contact_form').submit();
}

function delete_posting(location) {
  $.ajax({
    url: location,
    type: 'DELETE',
    error(err) {
      if (err.status === 303) {
        window.location.reload();
      } else {
        window.location.reload();
      }
    },
  });
}

function formatPlant(plant) {
  if (!plant.img) {
    return plant.text;
  }
  return $(
      `<span><img style = "height=35px; padding=3px;" src="${plant.img}" class="img-flag" /> ${plant.text}</span>`
  );
}

function convertArray(array) {
  const finalArray = {results: [{}]};
  if (array.results.length !== 0) {
    if (array.results.length > 15) {
      for (let i = 0; i < 15; i++) {
        finalArray.results[i] = {
          text: array.results[i].name,
          id: array.results[i].name,
          img: array.results[i].default_photo.square_url,
        };
      }
    } else {
      for (let i = 0; i < array.results.length; i++) {
        finalArray.results[i] = {
          text: array.results[i].name,
          id: array.results[i].name,
          img: array.results[i].default_photo.square_url,
        };
      }
    }
  }
  return finalArray;
}

function onLocationFound(e) {
  const radius = e.accuracy / 2;
  marker.setLatLng(e.latlng).bindPopup(`You are within ${radius} meters from this point`).openPopup();
  map.setView(marker.getLatLng(), map.getZoom());
}
