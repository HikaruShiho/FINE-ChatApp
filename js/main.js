import { initializeApp } from "https://www.gstatic.com/firebasejs/9.8.1/firebase-app.js";
import { getDatabase, ref, push, set, get, update, onChildAdded, remove, onChildRemoved } from "https://www.gstatic.com/firebasejs/9.8.1/firebase-database.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut, updateProfile, deleteUser } from "https://www.gstatic.com/firebasejs/9.8.1/firebase-auth.js";
import { API_KEY, AUTH_DOMAIN, PROJECT_ID, STRAGE_BUCKET, MESSAGING_SENDER_ID, APP_ID } from "./config";

const firebaseConfig = {
	apiKey: API_KEY,
	authDomain: AUTH_DOMAIN,
	projectId: PROJECT_ID,
	storageBucket: STRAGE_BUCKET,
	messagingSenderId: MESSAGING_SENDER_ID,
	appId: APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

const GLOBAL = {
	currentLoginUser: {
		userId: "",
		user: "",
	},
	auth: getAuth()
}

/**
 * 初期処理
 * @return { void }
 * @param { void }
 */
const init = function () {
	screenLoading();
	observeFunc();
	clickEventsFunc();
	scrollBottom();
}

/**
 * 状態監視の処理
 * @return { void }
 * @param { void }
 */
const observeFunc = function () {
	onChildAdded(ref(db, "chat/messages"), getMessage,);
	onAuthStateChanged(GLOBAL.auth, observeLoginUser);
	document.getElementById("message").addEventListener("input", variableTextarea);
	// onValue(ref(db, "chat/messages"), observeDisplayMessage);
	// onChildRemoved(ref(db, "chat"), function (snapshot) {
	// 	console.log(snapshot.key);
	// 	console.log(snapshot.val());
	// });
}

/**
 * クリックイベントの関数
 * @return { void } 
 * @param { void }
 */
const clickEventsFunc = function () {
	document.getElementById("message").addEventListener("keydown", sendMessage);
	document.getElementById("submit_btn").addEventListener("click", sendMessage);
	document.getElementById("register_btn").addEventListener("click", registerUser);
	document.getElementById("login_btn").addEventListener("click", loginUser);
	document.getElementById("logout_btn").addEventListener("click", logOut);
	document.getElementById("user_delete_btn").addEventListener("click", deleteAccount);
	document.getElementById("nav_btn").addEventListener("click", navOpen);
	document.getElementById("display_name_change").addEventListener("click", changeUsernameOpen);
	document.getElementById("dispay_name_change_btn").addEventListener("click", changeUserName);
}

/**
 * メッセージを送信
 * @return { void }
 * @param { void }
 */
const variableTextarea = function () {
	const minHeight = 26;
	if (this.value === "" || !this.value.match(/\S/g)) {
		this.style.height = minHeight + "px";
	} else {
		this.style.height = this.scrollHeight + "px";
	}
}

/**
 * メッセージを送信
 * @return { void }
 * @param { void }
 */
const sendMessage = function (e) {
	if (this.dataset.action === "click" || e.keyCode === 13 && e.shiftKey) {
		const dbref = ref(db, "chat/messages");
		const $message = document.getElementById("message");
		if ($message.value.replace(/^\s+|\s+$/g, "")) {
			const newPostRef = push(dbref);
			set(newPostRef, {
				user_id: GLOBAL.auth.currentUser.uid,
				user: GLOBAL.auth.currentUser.displayName,
				text: $message.value,
				time: getNowTime(),
			});
			$message.value.replace(/\r?\n/g, '');;
			$message.value = "";
		} else {
			return false;
		}
		$message.style.height = "26px";
	}
}

/**
 * 現在時刻を取得
 * @return { NowTime } HH:MM
 * @param { void }
 */
const getNowTime = function () {
	const now = new Date();
	let hour = ("0" + now.getHours()).slice(-2);
	let min = ("0" + now.getMinutes()).slice(-2);
	return `${hour}:${min}`;
}

/**
 * 現在時刻を取得
 * @return { NowDateTime } YYYY/MM/DD HH:MM
 * @param { void }
 */
const getNowDate = function () {
	const now = new Date();
	let year = now.getFullYear();
	let month = ("0" + now.getMonth()).slice(-2);
	let day = ("0" + now.getDate()).slice(-2);
	return `${year}/${month}/${day} ${getNowTime()}`;
}

/**
 * メッセージを取得
 * @return { void }
 * @param { SnapshotObject } snapshot
 */
const getMessage = function (snapshot) {
	let data = snapshot.val();
	displayMessage(data, snapshot);
}

/**
 * メッセージを削除
 * @return { void }
 * @param { SnapshotObject } snapshot
 */
const deleteMessage = function () {
	let key = this.dataset.message_id;
	if (confirm("本当にメッセージを削除しますか？")) {
		remove(ref(db, "chat/messages/" + key));
		alert("削除しました。");
	}
	get(ref(db, "chat/messages")).then(function (snapshots) {
		displayMessageEmpty();
		snapshots.forEach(function (snapshot) {
			let data = snapshot.val();
			displayMessage(data, snapshot);
		});
	});
}

/**
 * メッセージを表示
 * @return { void }
 * @param { SnapshotObject } data
 * @param { SnapshotObject } snapshot
 */
const displayMessage = function (data, snapshot) {
	const $ul = document.getElementById("chat_message");
	const $li = document.createElement("li");
	if (GLOBAL.currentLoginUser.userId === data.user_id) {
		$li.style.justifyContent = "flex-end";
		$li.innerHTML = `
		<dl class="myself_message" data-message_id="${snapshot.key}" data-user-id="${data.user_id}">
			<dt>${data.time}</dt>
			<dd class="text">${data.text}</dd>
		</dl>`;
		$li.children[0].addEventListener("dblclick", deleteMessage);
	} else {
		$li.classList.add("friend");
		$li.innerHTML = `
		<dl data-message-id="${snapshot.key}" data-user-id="${data.user_id}">
			<dd class="icon">
				<img src="./images/icon_noImage.png" width="36" height="36">
			</dd>
			<dd class="text">${data.text}<span>${data.user}</span></dd>
			<dt>${data.time}</dt>
		</dl>`;
	}
	const audio = document.getElementById('sound_submit');
	audio.play();
	$ul.appendChild($li);
	scrollBottom();
}

/**
 * 表示されているメッセージを空にする
 * @return { void }
 * @param { void }
 */
const displayMessageEmpty = function () {
	const $ul = document.getElementById("chat_message");
	while ($ul.firstChild) {
		$ul.removeChild($ul.firstChild);
	}
}

/**
 * ユーザー登録の処理
 * @return { void }
 * @param { void }
 */
const registerUser = function () {
	const $email = document.getElementById("email");
	const $password = document.getElementById("password");
	const email = $email.value;
	const password = $password.value;
	createUserWithEmailAndPassword(GLOBAL.auth, email, password)

		//サインイン成功時の処理
		.then(function (userCredential) {

			//ユーザーネームをAuthenticationに登録
			updateProfile(GLOBAL.auth.currentUser, {
				displayName: GLOBAL.auth.currentUser.email.split('@')[0],
			}).then(function () {
				//chat/messages内のメッセージを取得表示
				get(ref(db, "chat/messages")).then(function (snapshots) {
					displayMessageEmpty();
					snapshots.forEach(function (snapshot) {
						let data = snapshot.val();
						displayMessage(data, snapshot);
					});
				});
			});

			//Realtime Databaseにユーザー情報を保存
			set(ref(db, "chat/users/" + userCredential.user.uid), {
				email: userCredential.user.email,
				name: userCredential.user.email.split('@')[0],
				create_at: getNowDate(),
			});
			$email.value = "";
			$password.value = "";
		}).catch(() => {
			document.getElementById("error_message").style.display = "block";
			document.getElementById("error_message").innerText = "メールアドレス、パスワードに誤りがあります";
		});
}

/**
 * ログインの処理
 * @return { void }
 * @param { void }
 */
const loginUser = function () {
	const email = document.getElementById("email").value;
	const password = document.getElementById("password").value;
	signInWithEmailAndPassword(GLOBAL.auth, email, password)
		.then(function () {
			get(ref(db, "chat/messages")).then(function (snapshots) {
				displayMessageEmpty();
				snapshots.forEach(function (snapshot) {
					let data = snapshot.val();
					displayMessage(data, snapshot);
				});
			});
		}).catch(() => {
			document.getElementById("error_message").style.display = "block";
			document.getElementById("error_message").innerText = "メールアドレス、パスワードに誤りがあります";
		});
}

/**
 * ログアウトの処理
 * @return { void }
 * @param { void }
 */
const logOut = function () {
	if (confirm("ログアウトしますか？")) {
		signOut(GLOBAL.auth).then(() => {
			email.value = "";
			password.value = "";
		}).catch((error) => {
			console.log(error.message, "ログアウトに失敗しました。");
		});;
	}
}

/**
 * 表示名変更
 * @return { void }
 * @param { void }
 */
const changeUserName = function () {
	const $display_name = document.getElementById("display_name");
	updateProfile(GLOBAL.auth.currentUser, {
		displayName: $display_name.value,
	}).then(function () {
		document.getElementById("nav_menu").classList.remove('nav-open');
		document.getElementById("auth_name_change").classList.remove('change_user_name-open');
		update(ref(db, "chat/users/" + GLOBAL.auth.currentUser.uid), {
			name: $display_name.value,
		});
		$display_name.value = "";
	}).catch(function (error) {
		console.log(error.message, "更新に失敗しました。");
	});
}

/**
 * ユーザー削除の処理
 * @return { void }
 * @param { void }
 */
const deleteAccount = function () {
	deleteUser(GLOBAL.auth.currentUser).then(function () {
		alert("アカウントを削除しました");
	}).catch(function (error) {
		aleart("ユーザーの削除に失敗しました。再度、ログインしてください。");
	});
}

/**
 * ログイン状態の監視
 * @return { void }
 * @param { UserObject } user
 */
const observeLoginUser = function (user) {
	console.log("発火");
	document.getElementById("nav_menu").classList.remove('nav-open');
	document.getElementById("auth_name_change").classList.remove('change_user_name-open');
	if (user) {
		document.getElementById("auth_screen").style.display = "none";
		document.getElementById("chat_screen").style.display = "block";
		GLOBAL.currentLoginUser.userId = user.uid;
		GLOBAL.currentLoginUser.user = user.email.split('@')[0];
		console.log("ログインユーザー：", GLOBAL.currentLoginUser);
	} else {
		document.getElementById("auth_screen").style.display = "block";
		document.getElementById("chat_screen").style.display = "none";
		GLOBAL.currentLoginUser.userId = "";
		GLOBAL.currentLoginUser.user = "";
		console.log("ログアウト中");
	}
}

/**
 * ログイン・サインインのタブ切り替え
 * @return { void }
 * @param { void }
 */
const $tab_btns = document.getElementsByClassName('tab_btn');
for (let i = 0; i < $tab_btns.length; i++) {
	$tab_btns[i].addEventListener('click', tabSwitch);
}
function tabSwitch() {
	document.getElementById("error_message").style.display = "none";
	document.getElementsByClassName('active')[0].classList.remove('active');
	this.classList.add('active');
	document.getElementsByClassName('is-show')[0].classList.remove('is-show');
	const arrayTabs = Array.prototype.slice.call($tab_btns);
	const index = arrayTabs.indexOf(this);
	document.getElementsByClassName('auth_btn')[index].classList.add('is-show');
}

/**
 * オープニング画面表示
 * @return { void }
 * @param { void }
 */
const screenLoading = function () {
	const $loading_screen = document.getElementById("loading_screen");
	if (sessionStorage.getItem("accessed")) {
		$loading_screen.style.display = "none";
	} else {
		sessionStorage.setItem("accessed", "true");
		gsap.to(document.getElementById("loading_screen"), {
			display: "none",
			opacity: 0,
			ease: "power2.in",
			duration: 0.3,
			delay: 3,
		});
	}
}

/**
 * ナビメニュー開閉処理
 * @return { void }
 * @param { void }
 */
const navOpen = function () {
	document.getElementById("nav_menu").classList.toggle('nav-open');
}

const changeUsernameOpen = function () {
	document.getElementById("auth_name_change").classList.toggle('change_user_name-open');
}

/**
 * 最後尾のメッセージに画面スクロール
 * @return { void }
 * @param { void }
 */
const scrollBottom = function () {
	const $chat_message = document.getElementById("chat_message");
	$chat_message.scrollTo(0, $chat_message.scrollHeight);
}

init();