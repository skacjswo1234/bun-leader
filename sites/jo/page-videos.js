(function(){
    var el = document.querySelector('.page-videos');
    if (!el) return;
    var folder = el.getAttribute('data-folder');
    if (!folder) return;
    fetch(folder + '/list.json')
        .then(function(r){ return r.ok ? r.json() : []; })
        .catch(function(){ return []; })
        .then(function(arr){
            if (!Array.isArray(arr) || arr.length === 0) return;
            arr.forEach(function(name){
                var section = document.createElement('div');
                section.className = 'content-section';
                var video = document.createElement('video');
                video.className = 'page-video';
                video.setAttribute('autoplay', '');
                video.setAttribute('muted', '');
                video.setAttribute('playsinline', '');
                video.src = folder + '/' + encodeURIComponent(name);
                var wrap = document.createElement('div');
                wrap.className = 'video-container';
                wrap.appendChild(video);
                section.appendChild(wrap);
                el.appendChild(section);
            });
            el.querySelectorAll('.page-video').forEach(function(v){
                v.addEventListener('timeupdate', function pauseBeforeEnd(){
                    var d = v.duration;
                    if (!isFinite(d) || d <= 0) return;
                    if (v.currentTime >= d - 0.1) {
                        v.pause();
                        v.currentTime = Math.max(0, d - 0.1);
                        v.removeEventListener('timeupdate', pauseBeforeEnd);
                    }
                });
            });
        });
})();
