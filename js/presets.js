// Presets management functionality
(function () {
  const hueSlider = document.getElementById('hueSlider');
  const satSlider = document.getElementById('satSlider');
  const desatEl = document.getElementById('desat');
  const hiEl = document.getElementById('highlight');
  const saveBtn = document.getElementById('save');
  const presetSel = document.getElementById('presets');
  const deleteBtn = document.getElementById('deletePreset');

  /* Presets */
  function loadPresets() {
    const list = JSON.parse(localStorage.getItem('colorPresets') || '[]');
    presetSel.innerHTML = '';
    // Add a default empty option
    const defaultOpt = document.createElement('option');
    defaultOpt.value = '';
    defaultOpt.text = '-- Select Preset --';
    presetSel.appendChild(defaultOpt);

    list.forEach((p, i) => {
      const opt = document.createElement('option');
      opt.value = i;
      opt.text = p.name;
      presetSel.appendChild(opt);
    });

    // Enable/disable delete button based on selection
    deleteBtn.disabled = presetSel.value === '';
  }

  // Delete button functionality
  deleteBtn.onclick = function () {
    if (presetSel.value === '') return;

    if (confirm('Are you sure you want to delete this preset?')) {
      const idx = parseInt(presetSel.value);
      const list = JSON.parse(localStorage.getItem('colorPresets') || '[]');

      // Remove the preset at the selected index
      list.splice(idx, 1);

      // Save updated list
      localStorage.setItem('colorPresets', JSON.stringify(list));

      // Refresh preset list
      loadPresets();
    }
  };

  // Update delete button state when preset selection changes
  presetSel.onchange = function () {
    const idx = presetSel.value;
    deleteBtn.disabled = idx === '';

    if (idx === '') return;
    const p = JSON.parse(localStorage.getItem('colorPresets'))[idx];
    hueSlider.noUiSlider.set([p.hMin, p.hMax]);
    satSlider.noUiSlider.set([p.sMin, p.sMax]);
    desatEl.value = p.desat;
    hiEl.value = p.highlight;
    updateSatGradient();
  };

  saveBtn.onclick = function () {
    const name = prompt('Preset name?');
    if (!name) return;
    const preset = {
      name,
      hMin: +hueSlider.noUiSlider.get()[0],
      hMax: +hueSlider.noUiSlider.get()[1],
      sMin: +satSlider.noUiSlider.get()[0],
      sMax: +satSlider.noUiSlider.get()[1],
      desat: +desatEl.value,
      highlight: +hiEl.value
    };
    const list = JSON.parse(localStorage.getItem('colorPresets') || '[]');
    list.push(preset);
    localStorage.setItem('colorPresets', JSON.stringify(list));
    loadPresets();
  };

  // Export presets functions
  window.presetsModule = {
    loadPresets
  };

  // Initialize presets on load
  loadPresets();
})();