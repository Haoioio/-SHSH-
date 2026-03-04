// 处理表单提交
function handleSubmit(event) {
    event.preventDefault();

    var ecidInput = document.getElementById('ecid');
    var ecidRaw = ecidInput.value.trim();

    if (!ecidRaw) {
        alert('请输入ECID');
        return;
    }

    var ecidDecimal = null;

    // 纯数字，直接当十进制
    if (/^\d+$/.test(ecidRaw)) {
        ecidDecimal = ecidRaw;
    }
    // 纯十六进制字符（不限长度）
    else if (/^[0-9a-fA-F]+$/.test(ecidRaw)) {
        ecidDecimal = hexToDec(ecidRaw);
        if (ecidDecimal === null) {
            alert('无效的十六进制ECID');
            return;
        }
    } else {
        alert('请输入有效的十进制或十六进制ECID');
        return;
    }

    var url = './proxy.php?ecid=' + encodeURIComponent(ecidDecimal);

    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);

    xhr.onreadystatechange = function() {
        if (xhr.readyState === 4) {
            var container = document.getElementById('queryResultContainer');
            container.innerHTML = '';
            if (xhr.status === 200) {
                try {
                    var data = JSON.parse(xhr.responseText);
                    if (!Array.isArray(data) || data.length === 0) {
                        container.innerHTML = '<p>未找到相关SHSH信息。</p>';
                        return;
                    }

                    var table = document.createElement('table');
                    table.style.width = '100%';
                    table.style.borderCollapse = 'collapse';
                    table.border = '1';
                    
                    // 添加大标题
                    var bigTitle = document.createElement('h3');
                    bigTitle.style.color = '#60a5fa';
                    bigTitle.style.marginBottom = '6px';
                    bigTitle.textContent = '查询到以下结果';
                    container.appendChild(bigTitle);

                    // 添加小标题，显示ecid和设备型号（用第一个设备型号示例）
                    var smallTitle = document.createElement('p');
                    smallTitle.style.color = '#aaa';
                    smallTitle.style.marginTop = '0';
                    smallTitle.style.marginBottom = '12px';
                    var firstModel = data[0].model || '-';
                    smallTitle.textContent = 'ECID: ' + ecidDecimal + ' ｜ 设备型号: ' + firstModel;
                    container.appendChild(smallTitle);

                    var thead = document.createElement('thead');
                    var headerRow = document.createElement('tr');
                    ['设备型号', 'iOS版本', '下载'].forEach(function(text){
                        var th = document.createElement('th');
                        th.style.padding = '8px';
                        th.style.border = '1px solid #ddd';
                        th.style.backgroundColor = '#f2f2f2';
                        th.textContent = text;
                        headerRow.appendChild(th);
                    });
                    thead.appendChild(headerRow);
                    table.appendChild(thead);

                    var tbody = document.createElement('tbody');
                    data.forEach(function(item){
                        var tr = document.createElement('tr');

                        var tdModel = document.createElement('td');
                        tdModel.style.padding = '8px';
                        tdModel.style.border = '1px solid #ddd';
                        tdModel.textContent = item.model || '-';
                        tr.appendChild(tdModel);

                        var tdFirmware = document.createElement('td');
                        tdFirmware.style.padding = '8px';
                        tdFirmware.style.border = '1px solid #ddd';
                        tdFirmware.textContent = item.firmware + '(' + item.build + ')' || '-';
                        tr.appendChild(tdFirmware);

                        var tdDownload = document.createElement('td');
                        tdDownload.style.padding = '8px';
                        tdDownload.style.border = '1px solid #ddd';

                        var a = document.createElement('a');
                        var downloadUrl = './download_shsh.php?ecid=' + encodeURIComponent(ecidDecimal)
                            + '&model=' + encodeURIComponent(item.model)
                            + '&firmware=' + encodeURIComponent(item.firmware)
                            + '&build=' + encodeURIComponent(item.build || '');

                        a.href = downloadUrl;
                        a.textContent = '下载';
                        a.target = '_blank';
                        a.style.color = '#007BFF';
                        a.style.textDecoration = 'none';

                        tdDownload.appendChild(a);
                        tr.appendChild(tdDownload);

                        tbody.appendChild(tr);
                    });
                    table.appendChild(tbody);
                    container.appendChild(table);

                } catch(e) {
                    container.innerHTML = '<p>解析数据失败，请稍后重试。</p>';
                }
            } else {
                container.innerHTML = '<p>查询失败，状态码：' + xhr.status + '</p>';
            }
        }
    };

    xhr.onerror = function() {
        var container = document.getElementById('queryResultContainer');
        container.innerHTML = '<p>请求出错，请检查网络连接。</p>';
    };

    xhr.send();
}

// 任意长度十六进制字符串转十进制字符串（无BigInt）
function hexToDec(hex) {
    if (!hex) return null;

    hex = hex.toLowerCase();

    var dec = '0';
    for (var i = 0; i < hex.length; i++) {
        var digit = parseInt(hex[i], 16);
        if (isNaN(digit)) return null;

        dec = multiplyStringByNumber(dec, 16);
        dec = addStrings(dec, digit.toString());
    }
    return dec;
}

// 字符串乘数字（非负整数）
function multiplyStringByNumber(str, num) {
    var carry = 0;
    var res = '';
    for (var i = str.length - 1; i >= 0; i--) {
        var n = parseInt(str[i]) * num + carry;
        carry = Math.floor(n / 10);
        res = (n % 10) + res;
    }
    if (carry > 0) res = carry + res;
    return res;
}

// 字符串大数相加
function addStrings(a, b) {
    var res = '';
    var carry = 0;
    var i = a.length - 1;
    var j = b.length - 1;
    while (i >= 0 || j >= 0 || carry) {
        var x = i >= 0 ? +a[i] : 0;
        var y = j >= 0 ? +b[j] : 0;
        var sum = x + y + carry;
        carry = Math.floor(sum / 10);
        res = (sum % 10) + res;
        i--;
        j--;
    }
    return res;
}