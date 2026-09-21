(function () {
  "use strict";

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

  function boot() {
    if (!document.getElementById("checkout-preview-root")) return;
    var api = window.CheckoutPreview || {};
    wireRequiredField("full-name", "full-name-field", "full-name-error");
    var phoneReady = api.wirePhoneCountryPicker
      ? api.wirePhoneCountryPicker()
      : Promise.resolve();
    Promise.resolve(phoneReady).then(function () {
      if (api.resolveShippingAddress) return api.resolveShippingAddress();
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
