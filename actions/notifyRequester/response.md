{if successResult.isApproved}
Good news! {successResult.reviewerLink} has approved your trial proposal:

{sheetUrl}

{if successResult.isComplete}
Your proposal is now completely approved!
{endif}
{else}
{successResult.reviewerLink} has rejected your trial proposal:

{sheetUrl}

Reason: {successResult.reason}

You may want to discuss with them and see if their issues can be resolved.
{endif}
