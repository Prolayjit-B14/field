"""
torch.utils.data shim module.
"""
from typing import Any, Iterator, Sequence

class Dataset:
    def __getitem__(self, index: int) -> Any:
        raise NotImplementedError
    def __len__(self) -> int:
        return 0

class DataLoader:
    def __init__(self, dataset: Dataset, batch_size: int = 1, shuffle: bool = False, num_workers: int = 0, **kwargs):
        self.dataset = dataset
        self.batch_size = batch_size
        self.shuffle = shuffle
    def __iter__(self) -> Iterator[Any]:
        return iter([])
    def __len__(self) -> int:
        return 0
