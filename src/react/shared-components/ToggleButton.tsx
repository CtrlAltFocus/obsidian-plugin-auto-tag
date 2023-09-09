import * as React from "react";
import {ReactNode, useState} from "react";
import classNames from "classnames";

type ToggleButtonProps = {
	className?: string,
	labelLeft?: ReactNode,
	labelRight?: ReactNode,
	defaultActive: boolean,
	onChange?: (isActive: boolean) => void,
	activeBgColorClass?: string,
	inactiveBgColorClass?: string,
	fadeInactive?: boolean,
};

export const ToggleButton = (props: ToggleButtonProps): React.ReactElement => {
	const {
		labelLeft,
		labelRight,
		defaultActive,
		onChange,
		className = '',
		activeBgColorClass = 'bg-cyan-700',
		inactiveBgColorClass = 'bg-gray-300',
		fadeInactive = true,
	} = props;
	const [toggleActive, setToggleActive] = useState(defaultActive);

	const handleToggleActive = () => {
		onChange && onChange(!toggleActive);
		setToggleActive(!toggleActive);
	};

	return (
		<div className={classNames(`flex space-x-1 items-center ${className}`, {'autotag-plugin__toggle--active': toggleActive, 'opacity-60': fadeInactive && !toggleActive})}>
			{labelLeft}
			<div
				className={classNames("w-10 h-5 flex items-center rounded-full mx-1 px-0.5", {
					[activeBgColorClass]: toggleActive,
					[inactiveBgColorClass]: !toggleActive
				})}
				onClick={handleToggleActive}>
				<div
					className={classNames("bg-white w-4 h-4 rounded-full transform", {
						'translate-x-5': toggleActive
					})}/>
			</div>
			{labelRight}
		</div>
	);
};
