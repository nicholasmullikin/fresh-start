
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
  if (window.location.pathname === '/plant/new') {
    // $('#location_map').css("display", "none");//hide map by default
    $('#zipcode').tooltip({trigger: 'hover', title: 'Enter a zipcode or use the map', container: 'body'});
    $('#plantZone').tooltip({
      trigger: 'hover',
      title: '(Optional) Enter a growing zone for your plant',
      container: 'body',
    });
    $('#plantTaxaID').tooltip({
      trigger: 'hover',
      title: '(Optional) Enter the scientific name for your plant',
      container: 'body',
    });
    $('.js-data-example-ajax').select2({
      ajax: {
        url: 'https://api.inaturalist.org/v1/taxa/autocomplete',
        dataType: 'json',
        delay: 250,
        data(params) {
          return {
            q: params.term, // search term
          };
        },
        processResults(data) {
          return convertArray(data);
        },
        cache: true,
      },
      minimumInputLength: 1,
      templateResult: formatPlant,
      templateSelection: formatPlant,
    });
    const price_selector = $('#price-selector');
    price_selector.select2({
      placeholder: '(Optional) Select or type a price',
      data: [
        {
          text: 'Monetary',
          children: [
            {
              text: 'Free',
              id: 'free',
            },
            {
              id: '1',
              text: '$1',
            },
            {
              id: '5',
              text: '$5',
            },
            {
              id: '10',
              text: '$10',
            },
            {
              id: '20',
              text: '$20',
            },
            {
              id: '50',
              text: '$50',
            },
          ],
        },
        {
          text: 'Another Plant',
          children: [
            {
              id: 'Best Offer',
              text: 'Best Offer',
            },
          ],
        },
      ],
      tags: true,
      createTag(params) {
        return {
          id: params.term,
          text: params.term,
          newOption: true,
        };
      },
    });
    price_selector.change(() => {
      let data = '';
      for (let i = 0; i < price_selector.select2('data').length; i++) {
        if (price_selector.select2('data')[i].text !== 'undefined' && data !== '') {
          data += ` or ${price_selector.select2('data')[i].text}`;
        } else {
          data = price_selector.select2('data')[i].text;
        }
      }
      $('#price_field').val(data);
    });
    $('#more_options').click(() => {
      if ($('.more').attr('style') !== '') {
        $('.more').attr('style', '');
        $('#more_options').text('Hide Details');
      } else {
        $('.more').attr('style', 'display:none;');
        $('#more_options').text('More Details');
      }
    });
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
    $('#display_map').click(() => {
      const map = $('#location_map');
      if (map.css('display') === 'none') {
        map.css('display', '');
      } else {
        map.css('display', 'none');
      }
    });
    $('#zipcode').change(function(e) {
      console.log(e);
      if (!(/(^\d{5}$)|(^\d{5}-\d{4}$)/.test(this.value))) {
        e.target.setCustomValidity('Zipcode is not valid');
      } else {
        e.target.setCustomValidity('');
      }
    });
    let latlng = [51.505, -0.09]; // temp value
    if ($('#location').length) {
      latlng = JSON.parse($('#location').attr('location'));
    }
    const map = L.map('mapid');
    map.setView(latlng, 10);
    $('#location_map').css('display', 'none');// hide map by default
    $('#lng').val(latlng[0]);
    $('#lat').val(latlng[1]);
    const marker = L.marker(map.getCenter(), {draggable: true}).addTo(map);
    L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}', {
      attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://mapbox.com">Mapbox</a>',
      maxZoom: 18,
      id: 'mapbox.streets',
      accessToken: 'pk.eyJ1IjoiZ291Z2UtbWl0dGVuLXNjdWQtbGFnZXIiLCJhIjoiY2o2eHZjbnkzMXNybDMycGRtajZrem9ocyJ9.bUUdO0y8oajtJIC9FgYL1w',
    }).addTo(map);

    L.Control.findUser = L.Control.extend({
      options:
                {position: 'topleft'},
      onAdd(map) {
        const controlDiv = L.DomUtil.create('div', 'leaflet-draw-toolbar leaflet-bar');
        L.DomEvent
            .addListener(controlDiv, 'click', L.DomEvent.stopPropagation)
            .addListener(controlDiv, 'click', L.DomEvent.preventDefault)
            .addListener(controlDiv, 'click', () => {
              map.locate({
                setView: true,
              });
            });

        const controlUI = L.DomUtil.create('a', 'glyphicon glyphicon-screenshot', controlDiv);
        controlUI.title = 'Find Me';
        return controlDiv;
      },
    });
    const findUserControl = new L.Control.findUser();
    map.addControl(findUserControl);

    const provider = new GeoSearch.OpenStreetMapProvider();
    const searchControl = new GeoSearch.GeoSearchControl({
      provider,
      style: 'bar',
      autoComplete: true, // optional: true|false  - default true
      autoCompleteDelay: 250, // optional: number      - default 250
      showMarker: false, // optional: true|false  - default true
      popupFormat: ({
        query,
        result,
      }) => result.label, // optional: function    - default returns result label
      maxMarkers: 1, // optional: number      - default 1
      keepResult: true, // optional: true|false  - default false
    });
    map.addControl(new L.Control.Fullscreen());
    map.addControl(searchControl);
    map.on('geosearch/showlocation', (e) => {
      marker.setLatLng(new L.LatLng(e.location.y, e.location.x));
      $('#lng').val(e.location.y);
      $('#lat').val(e.location.x);
    });
    map.on('click', (e) => {
      marker.setLatLng(e.latlng);
      $('#lng').val(e.latlng.lng);
      $('#lat').val(e.latlng.lat);
    });
    marker.on('dragend', (e) => {
      $('#lng').val(marker.getLatLng().lat);
      $('#lat').val(marker.getLatLng().lng);
    });
    let zipResults;
    $('#zipcode').blur(() => {
      const inputZip = $('#zipcode').val().replace(/[^0-9]/g, '');
      $.ajax({
        type: 'GET',
        dataType: 'json',
        url: `https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=0&postalcode=${inputZip}`,
        contentType: 'text/plain; charset=utf-8',
        success(msg) {
          zipResults = msg;
          marker.setLatLng(new L.LatLng(zipResults[0].lat, zipResults[0].lon));
          map.setView(new L.LatLng(zipResults[0].lat, zipResults[0].lon));
          $('#lng').val(zipResults[0].lon);
          $('#lat').val(zipResults[0].lat);
        },
      });
    });
    map.on('locationfound', onLocationFound);
    $('#clear').click(() => {
      $('input,textarea').val('');
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
  if (window.location.pathname === '/plant/postings') {
    $('button').click(function() {
      if (this.hasAttribute('id')) {
        if (this.getAttribute('id').length === 24) {
          const id = this.getAttribute('id');
          $('#each_posting').text($(`#name_${this.getAttribute('id')}`).text());
          $('#del-btn').click(() => {
            delete_posting(`/plant/edit/${id}`);
          });
        }
      }
    });
  }
  if (/\/plant\/view/.test(window.location.pathname)) {
    if ($('#reveal-info').length > 0) {
      $('#reveal-info').click((event) => {
        validate(event);
      });
    }

    // $('#reveal-info').click(function (event) {
    //     event.preventDefault();
    //     grecaptcha.execute();
    //     // let i = window.location.pathname.substring(window.location.pathname.length - 24);
    //     // i = "/plant/contact/".concat(i);
    //     // $.ajax({
    //     //     url: i,
    //     //     type: 'POST',
    //     //     statusCode: {
    //     //         200: function (response) {
    //     //             $("#info").text("Email: " + response);
    //     //             $("#reveal-info").remove();
    //     //         },
    //     //         402: function () {
    //     //             $("#info").text("User not found");
    //     //             $("#reveal-info").remove();
    //     //         }
    //     //     }
    //     // });
    // });
    const latlng = [51.505, -0.09]; // temp value
    latlng[0] = $('#lat').val();
    latlng[1] = $('#lon').val();
    const map = L.map('mapid');
    map.setView(latlng, 8);
    $('#location_map').css('display', 'none');// hide map by default

    const circle = L.circle(map.getCenter(), {radius: 2000, draggable: false}).addTo(map);
    L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}', {
      attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://mapbox.com">Mapbox</a>',
      maxZoom: 18,
      id: 'mapbox.streets',
      accessToken: 'pk.eyJ1IjoiZ291Z2UtbWl0dGVuLXNjdWQtbGFnZXIiLCJhIjoiY2o2eHZjbnkzMXNybDMycGRtajZrem9ocyJ9.bUUdO0y8oajtJIC9FgYL1w',
    }).addTo(map);

    const provider = new GeoSearch.OpenStreetMapProvider();
    const searchControl = new GeoSearch.GeoSearchControl({
      provider,
      style: 'bar',
      autoComplete: true, // optional: true|false  - default true
      autoCompleteDelay: 250, // optional: number      - default 250
      showMarker: false, // optional: true|false  - default true
      popupFormat: ({
        query,
        result,
      }) => result.label, // optional: function    - default returns result label
      maxMarkers: 1, // optional: number      - default 1
      keepResult: true, // optional: true|false  - default false
    });
    map.addControl(new L.Control.Fullscreen());
  }
});

// takes in ["task1", "task2"]
// async function parallel(arr) {
//     Promise.all(arr).then(function(values) {
//         console.log(values);
//         return values;
//     });
//
// }

async function parallel(arr) {
  // crop all images
  const cropperPromises = arr.map(async (crop) => {
    const response = await crop;
    return response;
  });

  const croppers = [];
  // log them in sequence
  for (const cropperPromise of cropperPromises) {
    croppers.push(await cropperPromise);
  }
  return croppers;
}

async function cropper_to_blob(cropper) {
  return new Promise(((resolve, reject) => {
    cropper.getCroppedCanvas().toBlob((val) => {
      resolve(val);
    });
  }));
}


async function get_all_blobs(arr) {
  // crop all images

  const cropperPromises = arr.map(async (crop) => {
    const response = await cropper_to_blob(crop);
    return response;
  });


  const cropper_blobs = [];
  // log them in sequence
  for (const cropperPromise of cropperPromises) {
    cropper_blobs.push(await cropperPromise);
  }
  return cropper_blobs;
}

function resizeAndUpload(file, num) {
  return new Promise(((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = function() {
      const tempImg = new Image();
      tempImg.src = reader.result;
      tempImg.onload = function() {
        const MAX_WIDTH = 1024;
        const MAX_HEIGHT = 576;
        let tempW = tempImg.width;
        let tempH = tempImg.height;
        if (tempW > tempH) {
          if (tempW > MAX_WIDTH) {
            tempH *= MAX_WIDTH / tempW;
            tempW = MAX_WIDTH;
          }
        } else if (tempH > MAX_HEIGHT) {
          tempW *= MAX_HEIGHT / tempH;
          tempH = MAX_HEIGHT;
        }
        const canvas = document.createElement('canvas');
        canvas.width = tempW;
        canvas.height = tempH;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(this, 0, 0, tempW, tempH);

        const div = document.createElement('div');
        div.id = `image_${num}`;
        div.classList.add(`image_${num}`);
        div.classList.add('images');

        $('#userImages').after(div);
        const image_div = $(`#image_${num}`);
        image_div.html(canvas);
        const cropper = new Cropper(canvas, {
          aspectRatio: 1,
          viewMode: 1,
          maxWidth: MAX_WIDTH,
          maxHeight: MAX_HEIGHT,
          zoomable: false,
          ready() {
            image_div.hide();
            $('#filesToUpload').change(() => {
              cropper.destroy();
              $('canvas').remove();
            });
            resolve(cropper);
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
          },
        });
      };
    };
    reader.readAsDataURL(file);
  }));
}

function validate(event) {
  event.preventDefault();
  grecaptcha.execute();
}

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
