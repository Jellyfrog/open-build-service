var canSave = false;

function hideOverlay(dialog) {
  $('.overlay').hide();
  dialog.addClass('hidden');
}

function saveImage() {
  if (canSave) {
    $.ajax({ url: isOutdatedUrl,
      dataType: 'json',
      success: function(json) {
        var isOutdated = json.isOutdated;
        if (isOutdated && !window.confirm("This image has been modified while you were editing it.\nDo you want to apply the changes anyway?"))
          return;
        $('#kiwi-image-update-form').submit();
      }
    });
  }
}

function enableSave(){
  canSave = true;
  $('#kiwi-image-update-form-save, #kiwi-image-update-form-revert').addClass('enabled');
}

function editDescriptionDialog(){
  var dialog = $('#kiwi-description').find('.dialog');
  dialog.removeClass('hidden');
  $('.overlay').show();
}

function editPreferencesDialog(){
  var dialog = $('#kiwi-preferences').find('.dialog');
  dialog.removeClass('hidden');
  $('.overlay').show();
}

function editPackageDialog(){
  var fields = $(this).parents('.nested-fields');
  var dialog = fields.find('.dialog');
  dialog.removeClass('hidden');
  $('.overlay').show();
}

function editRepositoryDialog(){
  var fields = $(this).parents('.nested-fields');
  var dialog = fields.find('.dialog');
  var normalMode = fields.find('.normal-mode');
  var expertMode = fields.find('.expert-mode');
  var sourcePath = fields.find("[id$='source_path']");

  dialog.removeClass('hidden');
  var matchedObsSourcePath = sourcePath.val().match(/^obs:\/\/([^\/]+)\/([^\/]+)$/);
  if (matchedObsSourcePath) {
    var projectField = fields.find('[name=target_project]');
    var repoField = fields.find('[name=target_repo]');
    var aliasField = fields.find('[name=alias_for_repo]');
    var expertRepoAlias = fields.find("[id$='alias']");
    var repoTypeField = fields.find("[id$='repo_type']");
    aliasField.val(expertRepoAlias.val());
    projectField.val(matchedObsSourcePath[1]);
    repoField.html('');
    repoField.append(new Option(matchedObsSourcePath[2]));
    repoField.val(matchedObsSourcePath[2]);
    repoTypeField.val('rpm-md');

    normalMode.show();
    expertMode.hide();
  }
  else {
    normalMode.hide();
    expertMode.show();
  }
  updateModeButton(fields);

  $('span[role=status]').text(''); // empty autocomplete status

  $('.overlay').show();
}

function addRepositoryErrorMessage(sourcePath, field) {
  if (sourcePath === 'obsrepositories:/') {
    field.text('If you want use obsrepositories:/ as source_path, please check the checkbox "use project repositories".');
  }
  else {
    field.text('The source path can not be empty!');
  }

  field.removeClass('hidden');
}

function closeDescriptionDialog() {
  var fields = $(this).parents('.nested-fields');
  var dialog = fields.find('.dialog');
  var name = dialog.find("[id$='name']");

  if (name.val() !== '') {
    $('#image-name').text(name.val());
  }
  else {
    fields.find(".ui-state-error").removeClass('hidden');
    return false;
  }

  var elements = fields.find('.fill');
  for(var i=0; i < elements.length; i++) {
    var object = dialog.find("[id$='" + $(elements[i]).data('tag') + "']");
    if ( object.val() !== "") {
      $(elements[i]).text(object.val());
    }
  }

  addDefault(dialog);

  if (!canSave) {
    enableSave();
  }

  fields.find(".ui-state-error").addClass('hidden');

  hideOverlay(dialog);
}


function closePreferencesDialog() {
  var fields = $(this).parents('.nested-fields');
  var dialog = fields.find('.dialog');

  var elements = fields.find('.fill');
  for(var i=0; i < elements.length; i++) {
    var object = dialog.find("[id$='" + $(elements[i]).data('tag') + "']");
    if ( object.val() !== "") {
      if ( $(elements[i]).data('tag') === 'type_image' ) {
        $(elements[i]).text(object.find(":selected").text());
      }
      else {
        $(elements[i]).text(object.val());
      }
    }
  }

  addDefault(dialog);

  if (!canSave) {
    enableSave();
  }

  hideOverlay(dialog);
}



function closeDialog() {
  var fields = $(this).parents('.nested-fields'),
      isRepository = fields.parents('#kiwi-repositories-list').size() === 1,
      name = fields.find('.kiwi_element_name'),
      dialog = fields.find('.dialog'),
      arch;

  if(isRepository) {
    var sourcePath = dialog.find("[id$='source_path']");
    if(sourcePath.val() !== '' && sourcePath.val() !== 'obsrepositories:/') {
      var alias = dialog.find("[id$='alias']");
      if (alias.val() !== '') {
        name.text(alias.val());
      }
      else {
        name.text(sourcePath.val().replace(/\//g, '_'));
      }
    }
    else {
      addRepositoryErrorMessage(sourcePath.val(), fields.find(".ui-state-error"));
      return false;
    }
  }
  else {
    var namePackage = dialog.find("[id$='name']").val();
    if(namePackage !== '') {
      name.text(namePackage);

      arch = dialog.find("[id$='arch']").val();
      if(arch !== '') {
        name.append(" <small>(" + arch + ")</small>");
      }
    }
    else {
      fields.find(".ui-state-error").removeClass('hidden');
      return false;
    }
  }

  addDefault(dialog);

  if( /^Add/.test(dialog.find('.box-header').text())) {
    dialog.find('.box-header').text('Edit '+ dialog.find('.box-header').text().split(' ')[1]);
  }

  fields.find(".ui-state-error").addClass('hidden');
  fields.find('.kiwi_list_item').removeClass('has-error');
  dialog.removeClass('new_element');

  if (!canSave) {
    enableSave();
  }

  hideOverlay(dialog);
}

function revertDialog() {
  var fields = $(this).parents('.nested-fields');
  var dialog = fields.find('.dialog');
  dialog.find(".ui-state-error").addClass('hidden');

  if(dialog.hasClass('new_element')) {
    hideOverlay(dialog);

    fields.find('.remove_fields').click();
  }
  else {
    $.each(dialog.find('input, select'), function(index, input) {
      if (input.type === 'checkbox') {
        $(input).prop('checked', input.getAttribute('data-default') === 'true');
      }
      else {
        $(input).val(input.getAttribute('data-default'));
      }
    });

    hideOverlay(dialog);
  }
}

function addDefault(dialog) {
  $.each(dialog.find('input, select'), function(index, input) {
    if (input.type === 'checkbox') {
      input.setAttribute('data-default', input.checked);
    }
    else {
      input.setAttribute('data-default', $(input).val());
    }
  });
}

function repositoryModeToggle() {
  var fields = $(this).parents('.nested-fields');

  fields.find('.normal-mode').toggle();
  fields.find('.expert-mode').toggle();

  updateModeButton(fields);
}

function updateModeButton(fields) {
  var expertMode = fields.find('.expert-mode');

  fields.find('.kiwi-repository-mode-toggle').
    text(expertMode.is(":visible") ? "Basic Mode" : "Expert Mode");
}

function hoverListItem() {
  $(this).find('.kiwi_actions').toggle();
}

function autocompleteKiwiRepositories(project, repoField) {
  if (project === "")
      return;
  $('.ui-autocomplete-loading').show();
  repoField.prop('disabled', true);
  $.ajax({
      url: repoField.data('ajaxurl'),
      data: {project: project},
      success: function (data) {
        repoField.html('');
        var foundoptions = false;
        $.each(data, function (idx, val) {
          repoField.append(new Option(val));
          repoField.prop('disabled', false);
          foundoptions = true;
        });
        if (!foundoptions)
          repoField.append(new Option('No repos found'));
      },
      complete: function () {
        $('.ui-autocomplete-loading').hide();
        repoField.trigger("change");
      }
  });
}

function kiwiRepositoriesSetupAutocomplete(fields) {
  var projectField = fields.find('[name=target_project]');
  var repoField = fields.find('[name=target_repo]');
  var aliasField = fields.find('[name=alias_for_repo]');

  projectField.autocomplete({
    source: projectField.data('ajaxurl'),
    minLength: 2,
    select: function (event, ui) {
      autocompleteKiwiRepositories(ui.item.value, repoField);
    },
    search: function() {
      $(this).addClass('loading-spinner');
    },
    response: function() {
      $(this).removeClass('loading-spinner');
    }
  });

  projectField.change(function () {
    autocompleteKiwiRepositories(projectField.val(), repoField);
  });

  repoField.change(function () {
    var repoFieldValue = repoField.val();
    if (repoField.val() === 'No repos found') {
      repoFieldValue = '';
    }
    var sourcePath = fields.find("[id$='source_path']");
    sourcePath.val("obs://" + projectField.val() + '/' + repoField.val());
    aliasField.val(repoFieldValue + '@' + projectField.val()).
      trigger("change");
    var repoTypeField = fields.find("[id$='repo_type']");
    repoTypeField.val('rpm-md');
  });

  aliasField.change(function () {
    fields.find("[id$='alias']").val($(this).val());
  });
}

function kiwiPackagesSetupAutocomplete(fields) {
  var packageField = fields.find('[id$=name]');

  packageField.autocomplete({
    source: function (request, response) {
      var repositories = $("#kiwi-repositories-list [id$='source_path']").map(function() { return this.value;}).get();
      var repositoryDestroyFields = $("#kiwi-repositories-list [id$='_destroy']");
      var usingProjectRepositories =  $('#kiwi_image_use_project_repositories').prop('checked');
      repositoryDestroyFields.each(function(index, input){ // remove destroyed repositories from the payload
        if ($(input).val() === "1") {
          repositories.splice(index, 1);
        }
      });
      var payload = { term: request.term, repositories: repositories };
      if (usingProjectRepositories) {
        payload.useProjectRepositories = true;
      }
      $.getJSON(packageField.data('ajaxurl'), payload,
        function (data) {
          response(data);
        });
    },
    search: function() {
      $(this).addClass('loading-spinner');
    },
    response: function() {
      $(this).removeClass('loading-spinner');
    },
    minLength: 2
  });
}

$(document).ready(function(){
  // Save image
  $('#kiwi-image-update-form-save').click(saveImage);
  $('#kiwi_image_use_project_repositories').click(function(){
    $('#kiwi-repositories-list, #use-project-repositories-text').toggle();
    enableSave();
  });

  // Revert image
  $('#kiwi-image-update-form-revert').click(function(){
    if ($(this).hasClass('enabled')) {
      if (window.confirm('Attention! All unsaved data will be lost! Continue?')) {
        window.location.reload();
      }
    }
  });

  // Enable save button
  $('.remove_fields').click(enableSave);

  // Edit dialog for Description
  $('.description_edit').click(editDescriptionDialog);
  $('.close-description-dialog').click(closeDescriptionDialog);

  // Edit dialog for Description
  $('.preferences_edit').click(editPreferencesDialog);
  $('.close-preferences-dialog').click(closePreferencesDialog);

  // Edit dialog for Repositories and Packages
  $('.repository_edit').click(editRepositoryDialog);
  $('.package_edit').click(editPackageDialog);
  $('#kiwi-repositories-list .close-dialog, #kiwi-packages-list .close-dialog').click(closeDialog);
  $('.revert-dialog').click(revertDialog);
  $('.kiwi-repository-mode-toggle').click(repositoryModeToggle);
  $('#kiwi-repositories-list .kiwi_list_item, #kiwi-packages-list .kiwi_list_item').hover(hoverListItem, hoverListItem);
  $('[name=target_project]').each(function() {
    kiwiRepositoriesSetupAutocomplete($(this).parents('.nested-fields'));
  });
  $('#kiwi-packages-list .nested-fields').each(function() {
    kiwiPackagesSetupAutocomplete($(this));
  });

  // After inserting new repositories add the Callbacks
  $('#kiwi-repositories-list').on('cocoon:after-insert', function(e, addedFields) {
    var lastOrder = 0;
    var orders = $(this).find("[id$='order']");
    var lastNode = $(orders[orders.length - 2]);
    if (lastNode.length > 0) {
      lastOrder = parseInt(lastNode.val());
    }
    $(addedFields).find("[id$='order']").val(lastOrder + 1);
    $('.overlay').show();
    $(addedFields).find('.repository_edit').click(editRepositoryDialog);
    $(addedFields).find('.close-dialog').click(closeDialog);
    $(addedFields).find('.revert-dialog').click(revertDialog);
    $(addedFields).find('.kiwi-repository-mode-toggle').click(repositoryModeToggle);
    $(addedFields).find('.kiwi_list_item').hover(hoverListItem, hoverListItem);
    kiwiRepositoriesSetupAutocomplete($(addedFields));
    $('#no-repositories').hide();
  });

  $('#kiwi-repositories-list').on('cocoon:after-remove', function() {
    if ($(this).find('.nested-fields:visible').size() === 0) {
      $('#no-repositories').show();
    }
  });

  // After inserting new packages add the Callbacks
  $('#kiwi-packages-list').on('cocoon:after-insert', function(e, addedFields) {
    $('.overlay').show();
    $(addedFields).find('.package_edit').click(editPackageDialog);
    $(addedFields).find('.close-dialog').click(closeDialog);
    $(addedFields).find('.revert-dialog').click(revertDialog);
    $(addedFields).find('.kiwi_list_item').hover(hoverListItem, hoverListItem);
    kiwiPackagesSetupAutocomplete($(addedFields));
    $('#no-packages').hide();
  });

  $('#kiwi-packages-list').on('cocoon:after-remove', function() {
    if ($(this).find('.nested-fields:visible').size() === 0) {
      $('#no-packages').show();
    }
  });
});
