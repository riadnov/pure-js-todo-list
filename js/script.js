;(function() {
	'use strict';

	const isTouchDevice = 'ontouchstart' in window;
	const startMoveEvent = (isTouchDevice ? 'touchstart' : 'mousedown');
	const moveEvent = (isTouchDevice ? 'touchmove' : 'mousemove');
	const endMoveEvent = (isTouchDevice ? 'touchend' : 'mouseup');

	const input = document.getElementById('new-task-input');
	const addButton = document.getElementById('add-task-btn');
	const list = document.getElementById('list');

	window.onload = function() {
		buildListFromHash();
		recalculateProgress();
		input.focus();
	};

	addButton.addEventListener('click', function () {
        addTask();
		recalculateUrl();
		recalculateProgress();
    });

	input.addEventListener('keyup', function (event) {
        event.preventDefault();
        if (event.keyCode === 13) { // enter key
			addButton.click();
        }
    });

	document.getElementById('remove-all-tasks').addEventListener('click', function (event) {
        history.pushState('', document.title, window.location.pathname);
        window.location.reload();
    });

	function addTask() {
		if ((input.value = input.value.trim()) === "") {
			return;
		}
		list.appendChild(generateLi(input.value, false));
		input.value = "";
		input.focus();
	}

    function buildListFromHash() {
		list.innerHTML = "";

        let params = new URLSearchParams(window.location.hash.slice(1));
        let sum = params.get('s');
        params.delete('s');

        for (let item of params) {
            list.appendChild(generateLi(item[1], sum % 2));
            sum = Math.floor(sum / 2);
		}
	}

	function generateLi(inputValue, isChecked) {
		const li = document.createElement('li');
		li.className = 'list-group-item';

		if (!isTouchDevice) {
			li.onmouseenter = highlightTaskView;
			li.onmouseleave = normalizeTaskView;
		}

		li.appendChild(generateLiInner(inputValue, isChecked));

		li.addEventListener(startMoveEvent, dragAndDropTask(li));

		return li;

		function highlightTaskView(event) {
			const target = getTarget(event);
			target.className = 'list-group-item list-group-item-info';
			const removeBtn = target.getElementsByClassName('remove-btn')[0];
			removeBtn.style.display = 'inline';
		}

		function normalizeTaskView(event) {
			const target = getTarget(event);
			target.className = 'list-group-item';
			const removeBtn = target.getElementsByClassName('remove-btn')[0];
			removeBtn.style.display = 'none';
		}

		function generateLiInner(inputValue, isChecked) {
			const fragments = document.createDocumentFragment();

			fragments.appendChild(generateCheckbox(isChecked));
			fragments.appendChild(generateTaskText(inputValue));
			fragments.appendChild(generateRemoveBtn());

			return fragments;

			function generateCheckbox(isChecked) {
				const checkbox = document.createElement('input');
				checkbox.type = 'checkbox';
				checkbox.checked = isChecked;
				checkbox.addEventListener('change', function () {
                    recalculateUrl();
                    recalculateProgress();
                });
				return checkbox;
			}

			function generateTaskText(value) {
				const spanTaskText = document.createElement('span');
				spanTaskText.innerHTML = value;
				spanTaskText.className = 'task-text';
				return spanTaskText;
			}

			function generateRemoveBtn() {
				const spanRemoveBtn = document.createElement('span');
				spanRemoveBtn.className = 'remove-btn glyphicon glyphicon-remove pull-right';
				spanRemoveBtn.addEventListener('click', function () {
                    removeParentNodeOfClickedNode();
                    recalculateUrl();
                    recalculateProgress();
                });
				spanRemoveBtn.style.display = 'none';
				return spanRemoveBtn;

				function removeParentNodeOfClickedNode(event) {
					let target = getTarget(event);
					target.parentNode.parentNode.removeChild(target.parentNode);
				}
			}
		}

		function dragAndDropTask(li) {
			return function (event) {
				let previousLi = null;
				let nextLi = null;

				if (isMovable(getTarget(event))) {
					event.preventDefault();
					previousLi = li.previousElementSibling;
					nextLi = li.nextElementSibling;
					moveAt(event);
					document.addEventListener(moveEvent, onMove);
					li.addEventListener(endMoveEvent, onEndMove);
				}

				return false;

				function moveAt(event) {
					const pageY = (isTouchDevice ? event.touches[0].pageY : event.pageY);

					li.className = 'list-group-item list-group-item-info shadow';
					const liY = li.getBoundingClientRect().top + li.offsetHeight / 2;
					if (pageY > liY + li.offsetHeight / 2) {
						if (nextLi !== null) {
							li.parentNode.insertBefore(nextLi, li);
						} else {
							onEndMove();
						}
					} else if (pageY < liY - li.offsetHeight / 2) {
						if (previousLi !== null) {
							li.parentNode.insertBefore(li, previousLi);
						} else {
							onEndMove();
						}
					}
					previousLi = li.previousElementSibling;
					nextLi = li.nextElementSibling;
				}

				function onMove(event) {
					moveAt(event);
				}

				function onEndMove() {
					document.removeEventListener(moveEvent, onMove);
					li.removeEventListener(endMoveEvent, onEndMove);
					li.className = 'list-group-item';
					recalculateUrl();
				}

				function isMovable(target) {
					return !hasClass(target, 'remove-btn') && !(target instanceof HTMLInputElement);

					function hasClass(element, cls) {
						return (' ' + element.className + ' ').indexOf(' ' + cls + ' ') > -1;
					}
				}
			}
		}
	}

	function recalculateProgress() {
		const items = document.getElementById('list').getElementsByTagName('li');
		const progressRow = document.getElementById('progress-row-id');
		if (items.length > 0) {
			let count = 0;
			for (let item of items) {
				const isChecked = item.getElementsByTagName('input')[0].checked;
				count += isChecked ? 1 : 0;
			}
			const progressBar = document.getElementById('progress-bar');
			progressBar.style.width = count/items.length * 100 + '%';
			progressRow.className = 'row progress-row show';
		} else {
			progressRow.className = 'row progress-row hidden';
		}
	}

	function recalculateUrl() {
		let params = "";
		let number = 0;
		let sum = 0;
		let powerOfTwo = 1;

		for (let item of list.getElementsByTagName('li')) {
			sum = item.getElementsByTagName('input')[0].checked ? sum + powerOfTwo : sum;
            powerOfTwo *= 2;
            let text = item.getElementsByClassName('task-text')[0].innerHTML.split(' ').join('+');
			params += '&' + (number++) + '=' + text;
        }
		window.location.hash = '?s=' + sum + params;
	}

	function getTarget(event) {
		event = event || window.event; // gets normalized event
		return event.target || event.srcElement;
	}
})();