/* Clicking a skill shows which roles used it.
   The two sections already hold the answer — the chips in Skills and the
   tag rows on each role — so this just joins them up instead of asking the
   reader to hold both in their head.

   A chip that matches no role is left inert rather than offering a click
   that leads to an empty timeline. */
(function () {
  var chips = document.querySelectorAll('#skills .chip');
  var jobs = document.querySelectorAll('.timeline .job');
  var timeline = document.querySelector('.timeline');
  if (!chips.length || !jobs.length || !timeline) return;

  function tagsOf(job) {
    return Array.prototype.map.call(job.querySelectorAll('.j-tags li'), function (li) {
      return li.textContent.trim().toLowerCase();
    });
  }

  // Loose on purpose: the chip says ".NET Core" where a role is tagged
  // ".NET". Either containing the other counts as a match.
  function matches(skill, tags) {
    var s = skill.toLowerCase();
    return tags.some(function (t) {
      return t === s || t.indexOf(s) !== -1 || s.indexOf(t) !== -1;
    });
  }

  var jobTags = Array.prototype.map.call(jobs, function (j) {
    return { el: j, tags: tagsOf(j) };
  });

  var banner = document.createElement('div');
  banner.className = 'skill-filter';
  banner.hidden = true;
  timeline.parentNode.insertBefore(banner, timeline);

  var current = null;

  function clear() {
    current = null;
    banner.hidden = true;
    banner.textContent = '';
    Array.prototype.forEach.call(jobs, function (j) {
      j.classList.remove('dim', 'match');
    });
    Array.prototype.forEach.call(chips, function (c) {
      c.classList.remove('on');
    });
  }

  function apply(skill, chip) {
    if (current === skill) { clear(); return; }
    clear();
    current = skill;
    chip.classList.add('on');

    var hits = 0;
    jobTags.forEach(function (j) {
      if (matches(skill, j.tags)) { j.el.classList.add('match'); hits++; }
      else { j.el.classList.remove('match'); j.el.classList.add('dim'); }
    });

    banner.hidden = false;
    banner.innerHTML = '';
    var text = document.createElement('span');
    text.textContent = hits + (hits === 1 ? ' role used ' : ' roles used ') + skill;
    var clearBtn = document.createElement('button');
    clearBtn.type = 'button';
    clearBtn.className = 'skill-filter-clear';
    clearBtn.textContent = 'clear';
    clearBtn.addEventListener('click', clear);
    banner.appendChild(text);
    banner.appendChild(clearBtn);

    document.getElementById('experience').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  Array.prototype.forEach.call(chips, function (chip) {
    var skill = chip.textContent.trim();
    var hits = jobTags.filter(function (j) { return matches(skill, j.tags); }).length;
    if (!hits) return;

    chip.classList.add('linked');
    chip.setAttribute('role', 'button');
    chip.setAttribute('tabindex', '0');
    chip.setAttribute('title', 'Used in ' + hits + (hits === 1 ? ' role' : ' roles'));
    chip.addEventListener('click', function () { apply(skill, chip); });
    chip.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); apply(skill, chip); }
    });
  });

  addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && current) clear();
  });
})();
