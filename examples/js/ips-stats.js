(() => {
    const currentScriptSrc = document.currentScript && document.currentScript.src;
    if (!currentScriptSrc) return;
    const currSearchParams = new URL(currentScriptSrc).searchParams;
    const urlSearchParams = new URLSearchParams(window.location.search);

    const createIpsStatsStyle = () => {
        const styleEle = document.createElement('style');
        styleEle.innerHTML = `
            #qiushaocloud_sitecounter_total_ips_stats_box {
                display: flex;
                align-items: center;
                justify-content: center;
                margin: 0;
                padding: 0;
                width: 100%;
                height: 100%;
                position: fixed;
                left: 0;
                top: 0;
                box-sizing: border-box;
            }
        
            .ips-stats-box-warpper {
                margin: 0;
                box-sizing: border-box;
                font-family: Arial, sans-serif;
                color: #333;
                display: grid;
                width: 100%;
                height: 100%;
                padding: 10px;
                background: rgba(240, 244, 248, 0.9);
                grid-template-columns: 1fr;
                grid-template-rows: auto auto;
                gap: 10px;
            }

            .ips-stats-box-warpper[data-page-path] {
                grid-template-columns: 1fr 1fr;
                grid-template-rows: 1fr;
            }
        
            .ips-stats-box-warpper * {
                padding: 0;
                margin: 0;
                box-sizing: border-box;
            }
        
            .ips-stats-box-warpper h4 {
                margin-bottom: 10px;
            }
        
            .ips-stats-box-warpper .text-ellipsis {
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }
            
            .ips-stats-box-warpper button {
                padding: 10px 15px;
                background: #00bcd4;
                color: #fff;
                border: none;
                border-radius: 5px;
                cursor: pointer;
                transition: background 0.3s;
            }
        
            @media (any-hover: hover) {
                .ips-stats-box-warpper button:hover {
                    background: #0097a7;
                }
            }
        
            .ips-stats-box-warpper .site-ips-stats-box,
            .ips-stats-box-warpper .site-page-ips-stats-box {
                background: #fff;
                padding: 10px;
                border-radius: 10px;
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
                overflow: auto;
            }

            .ips-stats-box-warpper .site-page-ips-stats-box .other-page-title{
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
                max-width: calc(100% - 110px);
                display: inline-block;
                position: relative;
                top: 5px;
            }
        
            .ips-stats-box-warpper .site-log-day,
            .ips-stats-box-warpper .site-page-log-day {
                margin-top: 10px;
                background: #f4f4f4;
                padding: 10px;
                border-radius: 6px;
            }

            .ips-stats-box-warpper .site-log-day-title,
            .ips-stats-box-warpper .site-page-log-day-title {
                position: relative;
                padding-top: 5px;
                display: flex;
                align-items: center;
            }

            .ips-stats-box-warpper .site-log-day-title .day-pv-info,
            .ips-stats-box-warpper .site-page-log-day-title .day-pv-info {
                flex: 1;
            }

            .ips-stats-box-warpper .site-log-day-load-more-btn,
            .ips-stats-box-warpper .site-page-log-day-load-more-btn {
                background: none;
                color: #6d9296;
                padding: 5px 10px;
            }

            @media (any-hover: hover) {
                .ips-stats-box-warpper .site-log-day-load-more-btn:hover,
                .ips-stats-box-warpper .site-page-log-day-load-more-btn:hover {
                    background: none;
                    color: #0097a7;
                }
            }

            .ips-stats-box-warpper .site-log-day-ul-fold-btn,
            .ips-stats-box-warpper .site-page-log-day-ul-fold-btn  {
                background: #6e9296;
                padding: 5px 10px;
            }
        
            .ips-stats-box-warpper .site-log-day-ul,
            .ips-stats-box-warpper .site-page-log-day-ul {
                margin-top: 10px;
                list-style: none;
                padding-left: 0;
                /* max-height: 325px; */
                overflow: auto;
            }
        
            .ips-stats-box-warpper .site-log-day-ul li,
            .ips-stats-box-warpper .site-page-log-day-ul li {
                margin: 5px 0;
                background: #e0e0e0;
                font-size: 14px;
                padding: 10px;
                border-radius: 3px;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
        
            .ips-stats-box-warpper .site-log-day-ul li:nth-child(even),
            .ips-stats-box-warpper .site-page-log-day-ul li:nth-child(even) {
                background: #d0d0d0;
            }
        
            @media (any-hover: hover) {
                .ips-stats-box-warpper .site-log-day-ul li:hover,
                .ips-stats-box-warpper .site-page-log-day-ul li:hover {
                    background: #00bcd4;
                    color: #fff;
                }
            }
        
            .ips-stats-box-warpper .site-log-day-ip-info-warpper,
            .ips-stats-box-warpper .site-page-log-day-ip-info-warpper {
                /*white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
                display: flex;*/
                flex: 1;
            }

            /*.ips-stats-box-warpper .ip-info-warpper {
                display: flex;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }

            .ips-stats-box-warpper .ip-location-content {
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
                flex: 1;
            }*/

            .ips-stats-box-warpper .ip-count-warpper {
                padding: 0 10px;
            }
        
            .ips-stats-box-warpper .site-log-day-ip-detail-btn,
            .ips-stats-box-warpper .site-page-log-day-ip-detail-btn {
                padding: 5px 10px;
                background: #9E9E9E;
                margin-left: 10px;
                border: none;
                border-radius: 3px;
                color: #fff;
                cursor: pointer;
            }
        
            @media (any-hover: hover) {
                .ips-stats-box-warpper .site-log-day-ul li:hover .site-log-day-ip-detail-btn,
                .ips-stats-box-warpper .site-page-log-day-ul li:hover .site-page-log-day-ip-detail-btn {
                    background: #07a8bc;
                }
            
                .ips-stats-box-warpper .site-log-day-ul li:hover .site-log-day-ip-detail-btn:hover,
                .ips-stats-box-warpper .site-page-log-day-ul li:hover .site-page-log-day-ip-detail-btn:hover {
                    background: #0097a7;
                }
            }

            .ips-stats-box-close {
                position: absolute;
                display: block;
                width: 32px;
                height: 32px;
                right: 6px;
                top: 6px;
                cursor: pointer;
            }

            @media (any-hover: hover) {
                .ips-stats-box-close:hover {
                    transform: scale(1.2);
                }
            }
        
            @media (max-width: 768px) {
                .ips-stats-box-warpper {
                    grid-template-columns: 1fr !important;
                    grid-template-rows: auto auto !important;
                }
            
                .ips-stats-box-warpper .site-log-day-ip-detail-btn {
                    margin-left: 5px;
                }
            }
        `;
        document.head.appendChild(styleEle);
    }

    const createIpsStatsBoxEles = () => {
        if (!document.body || document.getElementById('qiushaocloud_sitecounter_total_ips_stats_box')) return;

        const sitePageFromUrl = currSearchParams.get('qpage') || urlSearchParams.get('qpage');
        const sortName = currSearchParams.get('qsortName') || urlSearchParams.get('qsortName') || 'desc';
        const dateRange = currSearchParams.get('qdateRange') || urlSearchParams.get('qdateRange') || '7days';
        const pageSize = currSearchParams.get('qpageSize') || urlSearchParams.get('qpageSize') || '100';
        const hideCloseBtn = /^(true|1)$/.test(currSearchParams.get('qhideCloseBtn') || urlSearchParams.get('qhideCloseBtn') || 'false');
        const showIpsStatsBox = /^(true|1)$/.test(currSearchParams.get('qshowIpsStatsBox') || urlSearchParams.get('qshowIpsStatsBox') || 'false');
        console.log(
            'createIpsStatsBoxEles sitePageFromUrl', sitePageFromUrl,' ,sortName', sortName, ' ,dateRange', dateRange,
            ' ,hideCloseBtn:', hideCloseBtn, ' ,showIpsStatsBox:', showIpsStatsBox
        );

        const ipsStatsBoxEle = document.createElement('div');
        ipsStatsBoxEle.id = 'qiushaocloud_sitecounter_total_ips_stats_box';
        ipsStatsBoxEle.innerHTML = `
            <div id="qiushaocloud_sitecounter_total_ips_stats_box">
                <span class="ips-stats-box-close" onclick="closeIpsStatsBox()" style="${hideCloseBtn ? 'display:none' : ''}">
                    <svg t="1717078963624" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="13022" width="100%" height="100%"><path d="M194.448 193.76866667c-174.831 174.831-174.831 458.288 0 633.119s458.288 174.831 633.119 0 174.831-458.288 0-633.119-458.288-174.831-633.119 0z m520.914 112.206c26.354 26.354 26.354 69.479 0 95.834l-108.52 108.52 108.52 108.52c26.354 26.354 26.354 69.479 0 95.834-26.354 26.354-69.479 26.354-95.834 0l-108.52-108.52-108.52 108.52c-26.354 26.354-69.479 26.354-95.834 0-26.354-26.354-26.354-69.479 0-95.834l108.52-108.52-108.52-108.52c-26.354-26.354-26.354-69.479 0-95.834 26.354-26.354 69.479-26.354 95.834 0l108.52 108.52 108.52-108.52c26.354-26.354 69.479-26.354 95.834 0z" p-id="13023" fill="#dbdbdb"></path></svg>
                </span>
                <div class="ips-stats-box-warpper" ${sitePageFromUrl? 'data-page-path="' + sitePageFromUrl + '"' : ''}>
                    <div class="site-ips-stats-box">
                        <h4>网站IP统计</h4>
                        <div
                            id="qiushaocloud_sitecounter_value_site_ips_stats"
                            data-ips-stats-sort-name="${sortName}"
                            data-logs-sort-name="${sortName}"
                            data-date-range="${dateRange}"
                            data-render-mode="ui"
                            data-logs-print-mode="ui"
                            data-page-size="${pageSize}"
                        ></div>
                    </div>
                    ${!sitePageFromUrl ? '' : `
                        <div class="site-page-ips-stats-box">
                            <h4 class="site-page-ips-stats-title" title="${sitePageFromUrl !== 'self' ? `页面(${sitePageFromUrl})` : '本页面'}IP统计">${sitePageFromUrl !== 'self' ? `页面(<span class="other-page-title">${sitePageFromUrl}</span>)` : '本页面'}IP统计</h4>
                            <div
                                id="qiushaocloud_sitecounter_value_site_page_ips_stats"
                                data-ips-stats-sort-name="${sortName}"
                                data-logs-sort-name="${sortName}"
                                data-date-range="${dateRange}"
                                data-render-mode="ui"
                                data-logs-print-mode="ui"
                                data-page-size="${pageSize}"
                                ${sitePageFromUrl !== 'self' ? `data-site-page-pathname="${sitePageFromUrl}"` : ''}
                            ></div>
                        </div>
                    `}
                </div>
            </div>
        `;
        !showIpsStatsBox && (ipsStatsBoxEle.style.display = 'none');
        document.body.appendChild(ipsStatsBoxEle);
        createIpsStatsStyle();
    }

    document.body ? createIpsStatsBoxEles() : window.addEventListener('DOMContentLoaded', createIpsStatsBoxEles);

    window.openIpsStatsBox = () => {
        const ipsStatsBoxEle = document.getElementById('qiushaocloud_sitecounter_total_ips_stats_box');
        ipsStatsBoxEle && (ipsStatsBoxEle.style.display = 'block');
    }

    window.closeIpsStatsBox = () => {
        const ipsStatsBoxEle = document.getElementById('qiushaocloud_sitecounter_total_ips_stats_box');
        ipsStatsBoxEle && (ipsStatsBoxEle.style.display = 'none');
    }

    window.toggleIpsStatsBox = () => {
        const ipsStatsBoxEle = document.getElementById('qiushaocloud_sitecounter_total_ips_stats_box');
        if (!ipsStatsBoxEle) return;

        if (ipsStatsBoxEle.style.display === 'none') {
            ipsStatsBoxEle.style.display = 'block';
        } else {
            ipsStatsBoxEle.style.display = 'none';
        }
    }

    window.showIpsStatsCloseBtn = () => {
        const ipsStatsBoxEle = document.getElementById('qiushaocloud_sitecounter_total_ips_stats_box');
        if (!ipsStatsBoxEle) return;
        const closeBtnEle = ipsStatsBoxEle.querySelector('.ips-stats-box-close');
        closeBtnEle && (closeBtnEle.style.display = 'block');
    }

    window.hideIpsStatsCloseBtn = () => {
        const ipsStatsBoxEle = document.getElementById('qiushaocloud_sitecounter_total_ips_stats_box');
        if (!ipsStatsBoxEle) return;
        const closeBtnEle = ipsStatsBoxEle.querySelector('.ips-stats-box-close');
        closeBtnEle && (closeBtnEle.style.display = 'none');
    }

    window.toggleIpsStatsCloseBtn = () => {
        const ipsStatsBoxEle = document.getElementById('qiushaocloud_sitecounter_total_ips_stats_box');
        if (!ipsStatsBoxEle) return;
        const closeBtnEle = ipsStatsBoxEle.querySelector('.ips-stats-box-close');
        if (closeBtnEle.style.display === 'none') {
            closeBtnEle.style.display = 'block';
        } else {
            closeBtnEle.style.display = 'none';
        }
    }
})();