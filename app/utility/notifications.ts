import { Lazy } from "./lazy";
import { BasicEvent, EventUtility } from "./events-utility";

export enum MessageButtonLayout
{
	/** Lay out buttons on the right. */
	Notification,
	/** Lay out buttons below, aligned right. */
	Dialog
}

export interface IMessageOptions<T>
{
	/** A list of CSS classes to apply to the message. */
	classes?: string[];
	/** Sets whether there is a close button. Default: true. */
	closeButton?: boolean;
	/** Custom buttons. */
	buttons?: IMessageButton<T>[];
	/** Auto close timeout in ms, set to -1 to disable. Default: Value calculated based on word count. */
	timeout?: number;
	/** Sets whether the dialog is modal. Default: false. */
	modal?: boolean;
	/** Sets the button layout. Default: Notification. */
	buttonLayout?: MessageButtonLayout;

	//TODO: add option to override ESC key default (cancel close event).
}
export interface IMessageButton<T>
{
	/** A list of CSS classes to add to the button. */
	classes?: string[];
	/** The label of the button. */
	label: HTMLElement | string;
	/** The title attribute of the button. */
	title?: string;
	/** Click handler, return true to close the message. */
	click: () => boolean;
	/** Can hold some custom information. */
	tag?: T;

	//TODO: add isDefault option (click on return).
}

/**
 * Singleton service for displaying notifications/dialogs.
 * (Requires font icon with class 'ci-delete' for the default close button.)
 * 
 * CSS Classes:
 * 		'message-box':	The root dialog element.
 * 		'message':		The content of the dialog.
 * 		'buttons':		The container for the dialog buttons.
 * 		'button':		A dialog button.
 * 		'enter':		Modifier that is initally applied to the root element when the dialog is shown.
 * 		'leave':		Modifier that is applied before the dialog is removed.
 * 
 * A transition or animation has to be associated with the 'leave' class.
 */
export class NotificationService
{
	private constructor() { }

	private static _instance = new Lazy(() => new NotificationService());
	static get instance() { return this._instance.value; }

	showError<T>(message: string | HTMLElement, options?: IMessageOptions<T>): BasicEvent<IMessageOptions<T>, IMessageButton<T>>
	{
		if (options == null) options = {};
		if (options.classes == null) options.classes = [];

		options.classes.push("error");
		return this.showMessage(message, options);
	}
	/**
	 * Shows a message which can either be a DOM element or text.
	 * You can fire the DOM event "close-notification" from within the dialog to close it.
	 * 
	 * @returns An event that is fired on close. Is passed the closing button if any.
	 */
	showMessage<T>(message: string | HTMLElement, options?: IMessageOptions<T>): BasicEvent<IMessageOptions<T>, IMessageButton<T>>
	{
		const win = window;
		//TODO: refactor to HTML templates
		if ('HTMLDialogElement' in window)
		{
			// Set up container
			var containerClass = "message-box-container"
			var container = document.querySelector(`.${containerClass}`);
			if (container == null)
			{
				container = document.createElement("div");
				container.classList.add(containerClass)
				document.body.appendChild(container);
			}

			if (options == null)
				options = <IMessageOptions<T>>{};
			if (options.closeButton == null) options.closeButton = true;
			if (options.buttons == null) options.buttons = [];
			if (options.modal == null) options.modal = false;
			if (options.buttonLayout == null) options.buttonLayout = MessageButtonLayout.Notification;
			if (options.timeout == null)
			{
				if (options.modal == false)
				{
					var text = typeof message == "string" ? message : message.innerText;
					var wordCount = text.split(/\W+/g).filter(s => s.match(/^\W*$/) == null).length;
					var baseLength = wordCount < 10 ? 2000 : 3000;
					options.timeout = baseLength + (wordCount * 200);
				}
				else
				{
					options.timeout = -1;
				}
			}
			if (options.classes == null) options.classes = [];

			var dialog = <HTMLDialogElement>document.createElement("dialog");
			dialog.classList.add("message-box");
			dialog.classList.add("enter");
			switch (options.buttonLayout)
			{
				case MessageButtonLayout.Notification:
					dialog.classList.add("buttons-layout-notification");
					break;
				case MessageButtonLayout.Dialog:
					dialog.classList.add("buttons-layout-dialog");
					break;
			}
			options.classes.forEach(c => dialog.classList.add(c));

			var closeEvent = new BasicEvent<IMessageOptions<T>, IMessageButton<T>>(options);

			var closeDialog = (b?: IMessageButton<T>) =>
			{
				if (autoCloseHandle != null)
				{
					window.clearTimeout(autoCloseHandle);
					autoCloseHandle = null;
				}

				// Cancel subscription to not call this again
				cc.cancel();
				dialog.classList.add('leave');
				EventUtility.once(dialog, 'transitionend', () => {
					dialog.classList.remove('leave');
					if (dialog.open)
						dialog.close();
					dialog.remove();
				});
				
				closeEvent.trigger(b);
			};
			var cc = EventUtility.cancelable(dialog, "close", e => {
				closeDialog();
				e.preventDefault();
			});
			dialog.addEventListener("close-notification", () => closeDialog());

			var msg = document.createElement("div");
			msg.classList.add("message");
			if (typeof message == "string")
				msg.textContent = message;
			else
				msg.appendChild(message);
			dialog.appendChild(msg);

			var autoCloseHandle: number | null = null;
			if (options.timeout != -1)
				autoCloseHandle = win.setTimeout(() => closeDialog(), options.timeout);

			var buttons = document.createElement("div");
			buttons.classList.add("buttons");
			var buttonsDefinitions = Array.from<IMessageButton<T>>(options.buttons);
			if (options.closeButton)
			{
				var label = document.createElement("span");
				label.classList.add('ci-delete');

				buttonsDefinitions.push({
					classes: ["button-close"],
					label: label,
					click: () => true
				});
			}

			buttonsDefinitions.forEach(b =>
			{
				var button = document.createElement("button");
				button.classList.add("button");
				if (b.classes != null)
					b.classes.forEach(c => button.classList.add(c));

				if (typeof b.label == 'string')
					button.textContent = b.label;
				else
					button.appendChild(b.label);

				if (b.title != null)
					button.title = b.title;
				button.addEventListener("click", () =>
				{
					var close = b.click();
					if (close)
						closeDialog(b);
				});
				buttons.appendChild(button);
			});

			dialog.appendChild(buttons);
			container.appendChild(dialog);
			win.setTimeout(() => dialog.classList.remove("enter"));

			if (options.modal)
			{
				dialog.classList.add("modal");
				dialog.showModal();
			}
			else
			{
				dialog.show();
			}

			return closeEvent;
		}
		else
		{
			// Derp
			alert(message);
			throw new Error("Browser does not support dialogs.");
		}
	}

	/**
	 * Convenience method for a confirm dialog.
	 * Sets various defaults and creates buttons.
	 * The button tag is of type ConfirmButtonType.
	 */
	showConfirm(message: string | HTMLElement, options?: IMessageOptions<ConfirmButtonType>, buttons = [ConfirmButtonType.Yes, ConfirmButtonType.No])
	{
		if (options == null) options = {};
		if (options.classes == null) options.classes = [];

		options.modal = true;
		options.closeButton = false;
		options.buttons = buttons.map(b => <IMessageButton<ConfirmButtonType>>{
			label: ConfirmButtonType[b],
			tag: b,
			click: () => true
		});

		return this.showMessage(message, options);
	}
}

export enum ConfirmButtonType
{
	Yes,
	No,
	Cancel
}