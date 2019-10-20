function showLoading() {
  $("#load").text("Loading...");
}

function displayNotes(notes) {

  $("#notes").empty();

  if (notes.length === 0) {
    $("#notes").append(
      '<li class="list-group-item">Sorry! No notes available for this article!</li>'
    );
  } else {
    notes.forEach((note, index) => {
      $("#notes").append(`<div class="card" style="width: 100%; margin-bottom: 10px;" id="note-${index}">
                                <ul class="list-group list-group-flush">
                                  <div class="row">
                                    <div class="col-9"><li class="list-group-item">${note}</li></div>
                                    <div class="col-3"><button type="button" class="btn btn-lg btn-block btn-danger" data-id="${index}" onclick="deleteNote(this)">Delete</button>
                                  </div>
                                </ul>
                              </div>`);
    });
  }
}

function getNotes(event) {
  console.log(event.id);
  $.getJSON("/notes/" + event.id, function(data, textStatus, jqXHR) {
    //console.log('data', data)
    $(".modal-footer > button").attr("id", data.id);
    $(".modal-title").text(`${data.title}`);
    $(".modal-title").attr("id", data.id);
    $("#notes-modal").modal("show");
    
    displayNotes(data.notes)

  });

  return false;
}

// delete note
function deleteNote (element) {
  let id = $(element).data('id')
  let article_id = $('.modal-title').attr('id')
  $('#note-' + id).remove();
  $.ajax({
    type: "delete",
    url: "/notes/" + id,
    data: {
      article_id: article_id
    },
    success: function(response) {
      console.log(response)
      if (response.nModified === 1) {
        let cards = $('.card');
        if (cards.length === 1) {
          displayNotes([]);
        }
      }      
    }
  });
}

function saveNotes(event) {
  console.log(event.id);
  $.ajax({
    type: "post",
    url: "/notes/" + event.id,
    data: {
      title: $("modal-title").text(),
      body: $("#note-text").val()
    },
    success: function(response) {
      console.log(response);
      $("#note-text").val("");
    }
  });
}
