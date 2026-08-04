document.addEventListener('DOMContentLoaded', function (){

const validationRules = {
    fullname: { minLength: 3},
    email: { mustContain: '@'}
};

const form = document.querySelector('#contact form');
const messageBox = document.getElementById('message');

const maxChars = 200;

const charCounter = document.createElement('p');
charCounter.style.fontSize = '13px';
charCounter.style.color = '#666666';
messageBox.after(charCounter)


messageBox.addEventListener('input', function(){

    let currentLength = messageBox.value.length;

    let remaining = maxChars - currentLength;

    charCounter.textContent = 'الأحرف المتبقية: ' + remaining;

    if (remaining < 0){
        charCounter.style.color = 'red';
    } else {
        charCounter.style.color = '#666666';
    }


});

form.addEventListener('submit', function(event){

    event.preventDefault();
    let fullnameValue = document.getElementById('fullname').value.trim();
    let emailValue = document.getElementById('email').value.trim();
    let phoneValue = document.getElementById('phone').value.trim();

    let errors = [];

    if (fullnameValue == '' || fullnameValue.length < validationRules.fullname.minLength){
        errors.push('- الاسم يجب ألا يقل عن 3 أحرف');
    }

    if (emailValue === '' || !emailValue.includes(validationRules.email.mustContain)){
        errors.push('- البريد الإلكتروني يجب أن يحتوي على علامة @');
    }

    let isPhoneValid = true;

    for (let i = 0; i < phoneValue.length; i++){
        
        let currentChar = phoneValue[i];

        if ( currentChar < '0' || currentChar > '9') {
            isPhoneValid = false;
        }
    }

        if (phoneValue === '' || !isPhoneValid){
            errors.push('- رقم الجوال يجب أن يحتوي أرقام فقط');
        }

        if (errors.length > 0){
            alert('الرجاء تصحيح التالي:\n' + errors.join('\n'));
            return;
        }

        // ============================================================
        // جديد: بدل ما نكتفي برسالة alert، نرسل البيانات فعليًا
        // للخادم عبر fetch()، والخادم هو من يحفظها بقاعدة البيانات
        // ============================================================

        // نجمع كل بيانات النموذج بكائن واحد منظم (مراجعة من محور الكائنات)
        const formData = {
            fullname: fullnameValue,
            email: emailValue,
            phone: phoneValue,
            inquiry: document.getElementById('inquiry').value,
            message: messageBox.value.trim(),
            subscribe: document.getElementById('subscribe').checked
        };

        // fetch مع الإعدادات: method POST (نرسل بيانات، لا نطلبها بس)،
        // headers توضح إننا نرسل JSON، وbody فيها البيانات نفسها كنص JSON
        fetch('/api/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        })
        .then(function (response) {
            return response.json();
        })
        .then(function (result) {
            if (result.success) {
                alert('تم إرسال النموذج وحفظه بنجاح، شكراً لتواصلكم معنا');
                form.reset();
                charCounter.textContent = 'الأحرف المتبقية: ' + maxChars;
            } else {
                alert('حدث خطأ: ' + result.message);
            }
        })
        .catch(function () {
            alert('تعذر الاتصال بالخادم — تأكدي أن الخادم يعمل (node server.js)');
        });


});

const darkModebtn = document.getElementById('darkModebtn');

function applyStoredTheme(){
    if(localStorage.getItem('theme') === 'dark'){
        document.body.classList.add('dark');
    }
}
applyStoredTheme();
if (darkModebtn) {
    darkModebtn.addEventListener('click', function(){
        document.body.classList.toggle('dark');
        const isDark = document.body.classList.contains('dark');
        localStorage.setItem('theme', isDark? 'dark': 'light');
    });
}

// ============================================================
// تصحيح: عنصر الاقتباس — استبدلنا الاعتماد على API خارجي غير مستقر
// بمصفوفة اقتباسات محلية، عشان يشتغل دائمًا بدون أي اعتماد على الإنترنت
// ============================================================
const quoteBox = document.getElementById('quoteBox');

const quotes = [
    { text: "التعلم العملي هو أساس الفهم الحقيقي", author: "قسم علوم الحاسب" },
    { text: "البرمجة فن حل المشاكل، لا مجرد كتابة كود", author: "مجهول" },
    { text: "أفضل طريقة نتعلم بها هي أن نبني شيئًا بأيدينا", author: "مجهول" },
    { text: "كل خبير كان يوماً مبتدئاً", author: "مجهول" },
];

if (quoteBox) {
    const randomIndex = Math.floor(Math.random() * quotes.length);
    const selected = quotes[randomIndex];
    quoteBox.textContent = '"' + selected.text + '" — ' + selected.author;
}


});
