import React, {ReactElement, ReactNode} from "react";
import {ToggleButton} from "../../../react/shared-components/ToggleButton";
import classNames from "classnames";

type TagsPreviewListProps = {
	tags: string[],
	onAccept: (selectedTags: string[]) => void,
	onCancel: (selectedTags?: string[]) => void,
};

export const TagsPreviewList = (props: TagsPreviewListProps): ReactElement => {
	const {tags, onAccept, onCancel} = props;
	const [acceptedTags, setAcceptedTags] = React.useState<string[]>(tags);

	const handleTagToggle = (tag: string, isActive: boolean) => {
		if (isActive) {
			setAcceptedTags(prev => [...prev, tag]);
		} else {
			setAcceptedTags(prev => prev.filter(t => t !== tag));
		}
	};

	return (
		<div>
			<div className="space-y-2">
				{
					tags.map((tag) =>
						<ToggleButton
							key={tag}
							className="autotag-plugin__toggle"
							labelRight={<span className="label-right">#{tag}</span>}
							defaultActive={true}
							onChange={(isActive: boolean) => handleTagToggle(tag, isActive)}
						/>
					)
				}
			</div>
			<div className="mt-4 space-x-2">
				<button
					onClick={() => onAccept(acceptedTags)}
					className={classNames(`btn btn-primary`, {'opacity-40': acceptedTags.length === 0})}
					disabled={acceptedTags.length === 0}
				>
					Accept
				</button>
				<button
					onClick={() => onCancel([])}
					className="btn btn-secondary"
				>
					Cancel
				</button>
			</div>
		</div>
	);
};
