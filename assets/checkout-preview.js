(function () {
  "use strict";

  var DRAFT_KEY = "checkout_preview_draft";

  function draftGet() {
    try {
      return JSON.parse(localStorage.getItem(DRAFT_KEY) || "{}") || {};
    } catch (e) {
      return {};
    }
  }

  function draftPatch(patch) {
    var next = draftGet();
    for (var key in patch) {
      if (Object.prototype.hasOwnProperty.call(patch, key)) next[key] = patch[key];
    }
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(next));
    } catch (e) {}
    return next;
  }

  function wireRequiredField(inputId, fieldId, errorId) {
    var input = document.getElementById(inputId);
    var field = document.getElementById(fieldId);
    var error = document.getElementById(errorId);
    if (!input || !field || !error) return;

    function validate() {
      var empty = !input.value.trim();
      field.classList.toggle("field--error", empty);
      input.setAttribute("aria-invalid", empty ? "true" : "false");
      error.hidden = !empty;
    }

    input.addEventListener("input", validate);
    input.addEventListener("blur", validate);
  }

  function wireNameDraft() {
    var input = document.getElementById("full-name");
    if (!input) return;
    var draft = draftGet();
    if (draft.name) input.value = draft.name;
    function save() {
      draftPatch({ name: input.value.trim() });
    }
    input.addEventListener("input", save);
    input.addEventListener("change", save);
  }

  function boot() {
    if (!document.getElementById("checkout-preview-root")) return;
    var api = window.CheckoutPreview || {};
    api.draftGet = draftGet;
    api.draftPatch = draftPatch;
    window.CheckoutPreview = api;

    wireRequiredField("full-name", "full-name-field", "full-name-error");
    wireNameDraft();

    var phoneReady = api.wirePhoneCountryPicker
      ? api.wirePhoneCountryPicker()
      : Promise.resolve();
    Promise.resolve(phoneReady).then(function () {
      if (api.restorePhoneDraft) api.restorePhoneDraft();
      if (api.resolveShippingAddress) return api.resolveShippingAddress();
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
