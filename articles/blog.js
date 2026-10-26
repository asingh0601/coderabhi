/* Filtering the post list by topic.

   Six posts do not strictly need a filter. Twenty will, and the mechanism
   costs almost nothing: the buttons read their own counts from the cards,
   so adding a post with a new topic needs no change here. */
(function () {
  var list = document.getElementById('postList');
  var bar = document.getElementById('postFilters');
  var note = document.getElementById('postEmpty');
  if (!list || !bar) return;

  var cards = Array.prototype.slice.call(list.querySelectorAll('[data-topic]'));
  var buttons = Array.prototype.slice.call(bar.querySelectorAll('button'));

  function apply(topic) {
    var shown = 0;
    cards.forEach(function (card) {
      var hit = topic === 'all' || card.getAttribute('data-topic') === topic;
      card.hidden = !hit;
      if (hit) shown++;
    });

    // the "More posts" heading is meaningless once the list is filtered
    var head = list.querySelector('.idx-head');
    if (head) head.hidden = topic !== 'all';

    buttons.forEach(function (b) {
      var on = b.getAttribute('data-filter') === topic;
      b.classList.toggle('on', on);
      b.setAttribute('aria-pressed', String(on));
    });

    if (note) {
      note.hidden = shown === cards.length ? false : true;
    }

    // the filter is in the URL, so a filtered list can be linked to
    var url = topic === 'all'
      ? location.pathname
      : location.pathname + '?topic=' + encodeURIComponent(topic);
    history.replaceState(null, '', url);
  }

  buttons.forEach(function (b) {
    b.setAttribute('aria-pressed', String(b.classList.contains('on')));
    b.addEventListener('click', function () {
      apply(b.getAttribute('data-filter'));
    });
  });

  var start = new URLSearchParams(location.search).get('topic');
  if (start && buttons.some(function (b) { return b.getAttribute('data-filter') === start; })) {
    apply(start);
  }
})();
